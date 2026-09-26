import { useCallback } from 'react'
import { scrollToElement, type ScrollToElementOptions } from '@macrulez/inview-core'

export interface UseScrollToOptions extends Omit<ScrollToElementOptions, 'target'> {}

/**
 * Returns a `scrollTo(el, options?)` callback that smooth-scrolls `target`
 * (default `window`) so `el` lands at its edge — the "scroll to an element,
 * with an offset" case `useScroll()`'s own `scrollTo` doesn't cover on its
 * own (that one only takes a raw `x`/`y` position).
 *
 * ```tsx
 * const scrollTo = useScrollTo()
 * scrollTo(sectionEl, { offset: 80 }) // e.g. clearing a sticky header
 * ```
 */
export function useScrollTo(target: Window | HTMLElement | null = typeof window !== 'undefined' ? window : null) {
  return useCallback(
    (el: Element | null | undefined, options?: UseScrollToOptions) => {
      if (!el || !target) return
      scrollToElement(el, { ...options, target })
    },
    [target]
  )
}
