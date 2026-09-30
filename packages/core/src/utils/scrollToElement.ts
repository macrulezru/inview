import { prefersReducedMotion } from './prefersReducedMotion'

export interface ScrollToElementOptions {
  /** the scrollable container to scroll. default `window` */
  target?: Window | HTMLElement
  /** px gap kept between the element's edge and the target's edge. default 0 */
  offset?: number
  /** default 'y' */
  axis?: 'x' | 'y'
  /** default 'smooth', unless prefers-reduced-motion is set (then 'auto') */
  behavior?: 'auto' | 'smooth'
}

function isWindowTarget(target: Window | HTMLElement): target is Window {
  return typeof window !== 'undefined' && target === window
}

/**
 * Scrolls `target` (default `window`) so `el` lands at its edge, offset by
 * `offset` px — the "scroll to element" case `ScrollEngine.scrollTo`
 * doesn't cover on its own (it only takes a raw `x`/`y` position, not an
 * element). Uses the browser's own smooth-scroll animation rather than a
 * hand-rolled rAF loop, so `duration`/`easing` aren't configurable — pass
 * `behavior: 'auto'` for an instant jump instead.
 */
export function scrollToElement(el: Element, options: ScrollToElementOptions = {}): void {
  if (typeof window === 'undefined') return

  const target = options.target ?? window
  const axis = options.axis ?? 'y'
  const offset = options.offset ?? 0
  const behavior = options.behavior ?? (prefersReducedMotion() ? 'auto' : 'smooth')

  const rect = el.getBoundingClientRect()

  if (isWindowTarget(target)) {
    const pos = axis === 'y' ? window.scrollY + rect.top - offset : window.scrollX + rect.left - offset
    target.scrollTo(axis === 'y' ? { top: pos, behavior } : { left: pos, behavior })
    return
  }

  const containerRect = target.getBoundingClientRect()
  const pos =
    axis === 'y'
      ? target.scrollTop + (rect.top - containerRect.top) - offset
      : target.scrollLeft + (rect.left - containerRect.left) - offset
  target.scrollTo(axis === 'y' ? { top: pos, behavior } : { left: pos, behavior })
}
