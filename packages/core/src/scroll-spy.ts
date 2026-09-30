import { createVisibilityEngine } from './visibility-engine'
import type { ObserverPool } from './observer-pool'

export interface ScrollSpyOptions {
  /**
   * default `'-45% 0px -45% 0px'` — a thin band near the target's vertical
   * center. Whichever section's boundary crosses that band becomes active,
   * the common "nav-highlight" idiom. Tune this (and `threshold`) per
   * layout — a page with very short sections might want a narrower band.
   */
  rootMargin?: string
  threshold?: number | number[]
  root?: Element | null
  pool?: ObserverPool
}

export interface ScrollSpy {
  destroy(): void
}

const DEFAULT_ROOT_MARGIN = '-45% 0px -45% 0px'

/**
 * Tracks which of `targets` currently sits in the "active" band (see
 * `rootMargin` above) and reports its index via `onChange` — the
 * framework-agnostic engine `useScrollSpy` wraps reactively. Built entirely
 * on the pooled visibility engine, so all targets sharing the same
 * `rootMargin`/`threshold`/`root` (the common case — they all come from one
 * `useScrollSpy` call) share a single native `IntersectionObserver`.
 *
 * When more than one target is simultaneously in the band (short sections,
 * a narrow band), the earliest one in `targets` wins — consistent,
 * deterministic, and matches reading order.
 */
export function createScrollSpy(
  targets: Array<Element | null | undefined>,
  options: ScrollSpyOptions | undefined,
  onChange: (activeIndex: number | null) => void
): ScrollSpy {
  if (typeof document === 'undefined') {
    return { destroy() {} }
  }

  const engine = createVisibilityEngine(options?.pool)
  const intersecting = new Array<boolean>(targets.length).fill(false)
  const teardowns: Array<() => void> = []

  function recompute() {
    const activeIndex = intersecting.findIndex(Boolean)
    onChange(activeIndex === -1 ? null : activeIndex)
  }

  targets.forEach((el, index) => {
    if (!el) return
    const handle = engine.observe(
      el,
      {
        rootMargin: options?.rootMargin ?? DEFAULT_ROOT_MARGIN,
        threshold: options?.threshold,
        root: options?.root ?? null,
      },
      (info) => {
        intersecting[index] = info.isIntersecting
        recompute()
      }
    )
    teardowns.push(handle)
  })

  return {
    destroy() {
      teardowns.forEach((fn) => fn())
      engine.destroy()
    },
  }
}
