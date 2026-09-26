import { useEffect, useRef, useState } from 'react'
import { createScrollSpy, type ScrollSpyOptions } from '@macrulez/inview-core'

export interface UseScrollSpyOptions extends ScrollSpyOptions {}

/**
 * Tracks which of `targets` currently sits in the "active" band (see
 * `ScrollSpyOptions.rootMargin`) and returns its index — the nav-highlight
 * case built entirely on the pooled visibility engine, one
 * `IntersectionObserver` shared across every target.
 *
 * `targets` must be a stable array (e.g. from `useState`) — a new array
 * literal every render forces a real re-subscribe, the same as `target`/
 * `root` elsewhere in this package.
 *
 * ```tsx
 * const [sections] = useState<(HTMLElement | null)[]>(() => [])
 * const activeIndex = useScrollSpy(sections)
 * ```
 *
 * `options` are captured once, when `targets` itself changes — the same
 * one-shot model `useRevealController` has, not something that reacts to a
 * changing options object on every re-render.
 */
export function useScrollSpy(
  targets: Array<HTMLElement | null | undefined>,
  options: UseScrollSpyOptions = {}
): number | null {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    if (typeof window === 'undefined' || targets.length === 0) {
      setActiveIndex(null)
      return
    }

    const spy = createScrollSpy(targets, optionsRef.current, setActiveIndex)
    return () => spy.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targets])

  return activeIndex
}
