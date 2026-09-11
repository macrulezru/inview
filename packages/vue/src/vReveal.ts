import type { Directive, DirectiveBinding } from 'vue'
import { createVisibilityEngine, type IntersectionInfo } from '@macrulez/inview-core'
import { viewportDefaults } from './config'

export interface RevealDirectiveOptions {
  /** class toggled on intersect. default 'in'. pass null to disable. */
  class?: string | null
  /** boolean data-attribute set alongside class, for pure-CSS attribute selectors */
  attribute?: string | null
  once?: boolean
  threshold?: number | number[]
  rootMargin?: string
  root?: HTMLElement | null
  onEnter?: (info: IntersectionInfo) => void
  onLeave?: (info: IntersectionInfo) => void
}

// Shared with useElementVisibility's own module-level engine would also
// work, but a separate one keeps this directive's observers cheap to
// destroy independently (e.g. in tests) without touching the composable's.
const engine = createVisibilityEngine()
const stops = new WeakMap<HTMLElement, () => void>()

function bind(el: HTMLElement, binding: DirectiveBinding<RevealDirectiveOptions | undefined>) {
  const value = binding.value ?? {}
  const activeClass = value.class === undefined ? 'in' : value.class
  const activeAttribute = value.attribute ?? null
  const once = value.once ?? (binding.modifiers.once || viewportDefaults.once)

  const stop = engine.observe(
    el,
    {
      threshold: value.threshold ?? viewportDefaults.threshold,
      rootMargin: value.rootMargin ?? viewportDefaults.rootMargin,
      root: value.root ?? null,
      once,
      onEnter: value.onEnter,
      onLeave: value.onLeave,
    },
    (info) => {
      if (activeClass) el.classList.toggle(activeClass, info.isIntersecting)
      if (activeAttribute) {
        if (info.isIntersecting) el.setAttribute(activeAttribute, '')
        else el.removeAttribute(activeAttribute)
      }
    }
  )
  stops.set(el, stop)
}

function unbind(el: HTMLElement) {
  stops.get(el)?.()
  stops.delete(el)
}

function normalizeThreshold(threshold: number | number[] | undefined): string | number | undefined {
  return Array.isArray(threshold) ? threshold.join(',') : threshold
}

// Compares only the fields that actually affect the observer subscription
// (class/attribute/once/threshold/rootMargin/root) — onEnter/onLeave are
// intentionally excluded, same as the rest of the package's composables,
// where non-option fields aren't reactive. This lets a fresh inline options
// object every re-render (the common case in a template) skip the
// unsubscribe/resubscribe cycle as long as those field values didn't
// actually change.
function optionsEqual(
  a: RevealDirectiveOptions | null | undefined,
  b: RevealDirectiveOptions | null | undefined
): boolean {
  const av = a ?? {}
  const bv = b ?? {}
  return (
    av.class === bv.class &&
    av.attribute === bv.attribute &&
    av.once === bv.once &&
    av.rootMargin === bv.rootMargin &&
    av.root === bv.root &&
    normalizeThreshold(av.threshold) === normalizeThreshold(bv.threshold)
  )
}

/**
 * `v-reveal` — toggles a class (default `"in"`) and/or a data-attribute on
 * an element as it enters the viewport, without calling
 * useElementVisibility() yourself. A directive is DOM-level, not bound to
 * `setup()` the way a composable is, so it works inside `v-for` out of the
 * box — including items rendered after an async fetch, where a composable
 * can't be called per iteration.
 *
 * `v-reveal.once` is shorthand for `v-reveal="{ once: true }"`.
 * `v-reveal="{ once: true, onEnter: ... }"` for per-item options straight
 * off the loop variable. Falls back to `viewportDefaults`
 * (threshold/rootMargin/once) the same way `useElementVisibility` does.
 *
 * For a page-wide "every .reveal element, including ones that don't exist
 * yet" pass instead of per-element directives, see
 * `createRevealController` from `@macrulez/inview-core` (re-exported here).
 */
export const vReveal: Directive<HTMLElement, RevealDirectiveOptions | undefined> = {
  mounted: bind,
  updated(el, binding) {
    if (binding.value === binding.oldValue) return
    if (optionsEqual(binding.value, binding.oldValue)) return
    unbind(el)
    bind(el, binding)
  },
  unmounted: unbind,
}
