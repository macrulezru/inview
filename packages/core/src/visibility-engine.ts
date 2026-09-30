import { observerPool as defaultObserverPool, ObserverPool } from './observer-pool'
import type {
  IntersectionEdge,
  IntersectionInfo,
  VisibilityEngine,
  VisibilityHandle,
  VisibilityLiveOptions,
  VisibilityObserveOptions,
} from './types'

function computeEdge(entry: IntersectionObserverEntry, wasIntersecting: boolean): IntersectionEdge | undefined {
  if (entry.isIntersecting === wasIntersecting) return undefined
  const rootTop = entry.rootBounds ? entry.rootBounds.top : 0
  const enteringOrLeavingFromBottom = entry.boundingClientRect.top > rootTop
  if (entry.isIntersecting) return enteringOrLeavingFromBottom ? 'enter-bottom' : 'enter-top'
  return enteringOrLeavingFromBottom ? 'leave-bottom' : 'leave-top'
}

/**
 * Wraps the shared observer pool with enter/leave edge detection and
 * `once` support, without any framework-specific reactivity.
 */
export function createVisibilityEngine(pool: ObserverPool = defaultObserverPool): VisibilityEngine {
  const unsubs = new Set<VisibilityHandle>()

  function observe(
    el: Element,
    options: VisibilityObserveOptions,
    cb: (info: IntersectionInfo) => void
  ): VisibilityHandle {
    let wasIntersecting = false
    // Mutable copy of the subset `update()` can change live — `options`
    // itself is never mutated, so a caller holding onto its own reference
    // isn't surprised by it changing out from under them.
    const live: VisibilityLiveOptions = {
      once: options.once,
      onEnter: options.onEnter,
      onLeave: options.onLeave,
    }

    const rawUnobserve = pool.observe(el, options, (entry) => {
      const edge = computeEdge(entry, wasIntersecting)
      wasIntersecting = entry.isIntersecting

      const info: IntersectionInfo = {
        isIntersecting: entry.isIntersecting,
        intersectionRatio: entry.intersectionRatio,
        boundingClientRect: entry.boundingClientRect,
        edge,
      }

      cb(info)
      if (edge === 'enter-top' || edge === 'enter-bottom') live.onEnter?.(info)
      if (edge === 'leave-top' || edge === 'leave-bottom') live.onLeave?.(info)

      if (live.once && entry.isIntersecting) {
        unsubs.delete(handle)
        rawUnobserve()
      }
    })

    const handle = Object.assign(
      () => {
        unsubs.delete(handle)
        rawUnobserve()
      },
      {
        update(next: VisibilityLiveOptions) {
          live.once = next.once
          live.onEnter = next.onEnter
          live.onLeave = next.onLeave
        },
      }
    )

    unsubs.add(handle)
    return handle
  }

  return {
    observe,
    destroy() {
      unsubs.forEach((fn) => fn())
      unsubs.clear()
    },
  }
}
