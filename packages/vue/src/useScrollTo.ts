import { toValue, type MaybeRefOrGetter } from 'vue'
import { scrollToElement, type ScrollToElementOptions } from '@macrulez/inview-core'

export interface UseScrollToOptions extends Omit<ScrollToElementOptions, 'target'> {}

function defaultTarget(): Window | undefined {
  return typeof window !== 'undefined' ? window : undefined
}

/**
 * Returns a `scrollTo(el, options?)` callback that smooth-scrolls `target`
 * (default `window`) so `el` lands at its edge — the "scroll to an element,
 * with an offset" case `useScroll().scrollTo` doesn't cover on its own
 * (that one only takes a raw `x`/`y` position).
 *
 * ```ts
 * const scrollTo = useScrollTo()
 * scrollTo(sectionEl.value, { offset: 80 }) // e.g. clearing a sticky header
 * ```
 */
export function useScrollTo(target: MaybeRefOrGetter<Window | HTMLElement | null | undefined> = defaultTarget) {
  return (el: Element | null | undefined, options?: UseScrollToOptions) => {
    const resolvedTarget = toValue(target)
    if (!el || !resolvedTarget) return
    scrollToElement(el, { ...options, target: resolvedTarget })
  }
}
