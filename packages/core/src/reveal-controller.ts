import { createVisibilityEngine } from './visibility-engine'
import { staggerDelay, type StaggerDelayOptions } from './utils/staggerDelay'
import type { ObserverPool } from './observer-pool'
import type { IntersectionInfo } from './types'

export interface RevealStaggerOptions extends StaggerDelayOptions {
  /** CSS custom property the computed delay is written to. default '--reveal-delay'. pass null to not write it. */
  cssVar?: string | null
  /**
   * Also sets the `transition-delay` inline style on the element itself, in
   * addition to `cssVar`. An inline style wins the cascade regardless of any
   * `transition` shorthand a consumer declares later (e.g. a `.card`
   * hover-transition), which would otherwise silently swallow the stagger's
   * transition-delay. The CSS var keeps being written (unless `cssVar` is
   * null) since, unlike the inline style, it's inheritable — useful for
   * targeting descendants (`.reveal > .icon { transition-delay: var(--reveal-delay) }`).
   * default true
   *
   * Whichever of the two get written, both are automatically REMOVED again
   * once the element's reveal-in transition finishes (`transitionend`, with
   * a computed-duration-based fallback timer for when no transition actually
   * runs — `prefers-reduced-motion`, or no matching CSS `transition` at all).
   * The delay only exists to stagger that one transition; left in place
   * afterward, it would silently delay anything else that transitions on the
   * same element too (a hover effect on a `.reveal` link, for example) —
   * this cleanup is not configurable, it's the whole point of the delay
   * being scoped to the reveal in the first place.
   */
  applyInlineDelay?: boolean
}

export interface RevealControllerOptions {
  /** CSS selector for elements to observe. default '[data-reveal], .reveal' */
  selector?: string
  /** class toggled on an element as it enters the viewport. default 'in'. pass null to disable. */
  activeClass?: string | null
  /** boolean data-attribute set alongside activeClass, for pure-CSS attribute selectors. default null (off) */
  activeAttribute?: string | null
  /** default true — reveal-on-scroll effects almost always want this */
  once?: boolean
  threshold?: number | number[]
  rootMargin?: string
  root?: Element | null
  /** writes a computed transition-delay CSS var based on discovery order. pass false to disable. */
  stagger?: RevealStaggerOptions | false
  /** re-scans for newly added matching elements via MutationObserver. default true */
  watchMutations?: boolean
  /** root node the MutationObserver watches. default document.body */
  watchRoot?: Element
  onEnter?: (el: Element, info: IntersectionInfo) => void
  onLeave?: (el: Element, info: IntersectionInfo) => void
  pool?: ObserverPool
}

export interface RevealController {
  /** Re-scans `selector` for elements not yet observed — useful right after a synchronous DOM change if `watchMutations` is off. */
  refresh(): void
  destroy(): void
}

const DEFAULT_SELECTOR = '[data-reveal], .reveal'
const DEFAULT_ACTIVE_CLASS = 'in'
const DEFAULT_STAGGER_CSS_VAR = '--reveal-delay'

function readAttr(el: Element, name: string): string | null {
  return el.getAttribute(`data-reveal-${name}`)
}

function parseThreshold(raw: string | null): number | number[] | undefined {
  if (raw == null) return undefined
  const parts = raw
    .split(',')
    .map((p) => Number(p.trim()))
    .filter((n) => !Number.isNaN(n))
  if (parts.length === 0) return undefined
  return parts.length === 1 ? parts[0] : parts
}

function parseBoolean(raw: string | null): boolean | undefined {
  if (raw == null) return undefined
  return raw !== 'false'
}

/**
 * Scans the DOM for elements matching `selector` (a CSS class, a data
 * attribute, or both — see the default selector above) and toggles a class
 * and/or data-attribute on each as it enters the viewport, without any
 * per-element JS wiring. Built for the "~100 .reveal elements across
 * dynamically rendered lists" case a single useElementVisibility() call
 * (one ref, one already-known element) can't cover on its own — elements
 * matching `selector` that show up later (a v-for block rendered after an
 * async fetch) are picked up automatically via MutationObserver, and
 * elements removed from the DOM are unobserved automatically too.
 *
 * Every option can be overridden per element via matching data-attributes
 * — `data-reveal-once`, `data-reveal-threshold` (comma-separated for an
 * array), `data-reveal-root-margin`, `data-reveal-class`, `data-reveal-delay`
 * (explicit stagger override, ms), `data-reveal-group` (stagger index is
 * counted within a group instead of globally when set) — the controller's
 * own option only applies where the element doesn't say otherwise.
 *
 * Built entirely on the existing pooled visibility engine — this doesn't
 * introduce a second observer mechanism, just a DOM scan on top of it.
 */
export function createRevealController(options: RevealControllerOptions = {}): RevealController {
  if (typeof document === 'undefined') {
    return { refresh: () => {}, destroy: () => {} }
  }

  const selector = options.selector ?? DEFAULT_SELECTOR
  const activeClass = options.activeClass === undefined ? DEFAULT_ACTIVE_CLASS : options.activeClass
  const activeAttribute = options.activeAttribute ?? null
  const defaultOnce = options.once ?? true
  const stagger = options.stagger === false ? null : (options.stagger ?? {})
  const staggerCssVar = stagger && stagger.cssVar !== undefined ? stagger.cssVar : DEFAULT_STAGGER_CSS_VAR
  const applyInlineDelay = stagger?.applyInlineDelay ?? true
  const watchRoot = options.watchRoot ?? document.body

  const engine = createVisibilityEngine(options.pool)
  const teardownByEl = new Map<Element, () => void>()
  const staggerCounts = new Map<string, number>()
  const pendingStaggerCleanup = new WeakMap<HTMLElement, () => void>()
  const staggerCssVarName =
    staggerCssVar !== null ? (staggerCssVar.startsWith('--') ? staggerCssVar : `--${staggerCssVar}`) : null

  function nextStaggerIndex(group: string): number {
    const current = staggerCounts.get(group) ?? 0
    staggerCounts.set(group, current + 1)
    return current
  }

  function applyState(el: Element, active: boolean, elActiveClass: string | null) {
    if (elActiveClass) el.classList.toggle(elActiveClass, active)
    if (activeAttribute) {
      if (active) el.setAttribute(activeAttribute, '')
      else el.removeAttribute(activeAttribute)
    }
  }

  function writeStaggerDelay(el: HTMLElement, delayValue: string) {
    if (staggerCssVarName !== null) el.style.setProperty(staggerCssVarName, delayValue)
    if (applyInlineDelay) el.style.setProperty('transition-delay', delayValue)
  }

  function clearStaggerDelay(el: HTMLElement) {
    if (staggerCssVarName !== null) el.style.removeProperty(staggerCssVarName)
    if (applyInlineDelay) el.style.removeProperty('transition-delay')
  }

  // Parses a possibly comma-separated CSS <time> list (as `transition-duration`
  // is when several properties transition with different durations) and
  // returns the largest value in ms — used only to size the cleanup fallback
  // timer below, so overestimating slightly (taking the max, not the value
  // for whichever property actually matters) is harmless.
  function maxMs(cssTimeList: string): number {
    return cssTimeList.split(',').reduce((max, part) => {
      const trimmed = part.trim()
      const value = parseFloat(trimmed)
      if (Number.isNaN(value)) return max
      const ms = trimmed.endsWith('ms') ? value : value * 1000
      return Math.max(max, ms)
    }, 0)
  }

  // The stagger delay only needs to exist for the duration of the reveal-in
  // transition it was written for — left in place afterward, it silently
  // delays anything else that transitions on the same element too (e.g. a
  // hover effect on a `.reveal` link), since `transition-delay` is a single
  // cascading property, not scoped to just the reveal's own transition. Once
  // that transition settles (or, if it never actually runs — no matching CSS
  // `transition`, or `prefers-reduced-motion` disabling it — once a
  // conservative fallback timer elapses), the delay is removed again.
  function scheduleStaggerCleanup(el: HTMLElement, delayValue: string) {
    pendingStaggerCleanup.get(el)?.()

    const fallbackMs = maxMs(delayValue) + maxMs(getComputedStyle(el).transitionDuration) + 50
    let finished = false

    const finish = () => {
      if (finished) return
      finished = true
      el.removeEventListener('transitionend', finish)
      el.removeEventListener('transitioncancel', finish)
      clearTimeout(timeoutId)
      pendingStaggerCleanup.delete(el)
      clearStaggerDelay(el)
    }

    el.addEventListener('transitionend', finish)
    el.addEventListener('transitioncancel', finish)
    const timeoutId = setTimeout(finish, fallbackMs)

    pendingStaggerCleanup.set(el, finish)
  }

  function observeOne(el: Element) {
    if (teardownByEl.has(el)) return

    const elActiveClass = readAttr(el, 'class') ?? activeClass
    const elOnce = parseBoolean(readAttr(el, 'once')) ?? defaultOnce
    const elThreshold = parseThreshold(readAttr(el, 'threshold')) ?? options.threshold
    const elRootMargin = readAttr(el, 'root-margin') ?? options.rootMargin

    let delayValue: string | null = null
    if (stagger && el instanceof HTMLElement) {
      const explicitDelay = readAttr(el, 'delay')
      delayValue =
        explicitDelay != null
          ? `${explicitDelay}ms`
          : staggerDelay(nextStaggerIndex(readAttr(el, 'group') ?? ''), stagger)
      writeStaggerDelay(el, delayValue)
    }

    const unobserve = engine.observe(
      el,
      {
        threshold: elThreshold,
        rootMargin: elRootMargin,
        root: options.root ?? null,
        once: elOnce,
        onEnter: options.onEnter ? (info) => options.onEnter?.(el, info) : undefined,
        onLeave: options.onLeave ? (info) => options.onLeave?.(el, info) : undefined,
      },
      (info) => {
        if (info.isIntersecting && delayValue !== null && el instanceof HTMLElement) {
          // Reapplies the same value — a no-op on the very first enter (it's
          // already there from observeOne above), necessary on a later one if
          // `once: false` and a previous cycle's cleanup already cleared it.
          writeStaggerDelay(el, delayValue)
          scheduleStaggerCleanup(el, delayValue)
        }
        applyState(el, info.isIntersecting, elActiveClass)
      }
    )
    teardownByEl.set(el, unobserve)
  }

  function unobserveOne(el: Element) {
    const teardown = teardownByEl.get(el)
    if (!teardown) return
    teardown()
    teardownByEl.delete(el)
    if (el instanceof HTMLElement) pendingStaggerCleanup.get(el)?.()
  }

  function scanFor(root: ParentNode) {
    if (root instanceof Element && root.matches(selector)) observeOne(root)
    root.querySelectorAll(selector).forEach((el) => observeOne(el))
  }

  function unscanFor(root: Node) {
    if (!(root instanceof Element)) return
    if (root.matches(selector)) unobserveOne(root)
    root.querySelectorAll(selector).forEach((el) => unobserveOne(el))
  }

  scanFor(document)

  let mutationObserver: MutationObserver | null = null
  if (options.watchMutations ?? true) {
    mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) scanFor(node)
        })
        mutation.removedNodes.forEach(unscanFor)
      }
    })
    mutationObserver.observe(watchRoot, { childList: true, subtree: true })
  }

  return {
    refresh() {
      scanFor(document)
    },
    destroy() {
      mutationObserver?.disconnect()
      teardownByEl.forEach((fn) => fn())
      teardownByEl.clear()
      engine.destroy()
    },
  }
}
