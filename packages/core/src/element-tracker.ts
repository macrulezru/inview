import { rafLoop } from './raf-loop'
import { clamp } from './utils/clamp'
import type { DOMRectLike, ElementTracker, ElementTrackerState } from './types'

function toDomRectLike(rect: DOMRect): DOMRectLike {
  return {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  }
}

const emptyRect: DOMRectLike = { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }

function computeViewportProgress(rect: DOMRect, viewportHeight: number): number {
  const total = viewportHeight + rect.height
  if (total <= 0) return 0
  const traveled = viewportHeight - rect.top
  return clamp(traveled / total, 0, 1)
}

function computeState(el: HTMLElement): ElementTrackerState {
  const rect = el.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const elementCenter = rect.top + rect.height / 2
  const viewportCenter = viewportHeight / 2
  return {
    rect: toDomRectLike(rect),
    viewportProgress: computeViewportProgress(rect, viewportHeight),
    distanceFromCenter: elementCenter - viewportCenter,
  }
}

function statesEqual(a: ElementTrackerState, b: ElementTrackerState): boolean {
  return (
    a.rect.top === b.rect.top &&
    a.rect.left === b.rect.left &&
    a.rect.width === b.rect.width &&
    a.rect.height === b.rect.height &&
    a.viewportProgress === b.viewportProgress &&
    a.distanceFromCenter === b.distanceFromCenter
  )
}

/**
 * Tracks an element's position relative to the viewport (rect,
 * viewportProgress, distanceFromCenter) on the shared rAF loop.
 */
export function createElementTracker(el: HTMLElement): ElementTracker {
  if (typeof window === 'undefined') {
    const state: ElementTrackerState = { rect: emptyRect, viewportProgress: 0, distanceFromCenter: 0 }
    return {
      getState: () => state,
      subscribe: (cb) => {
        cb(state)
        return () => {}
      },
      destroy: () => {},
    }
  }

  const subscribers = new Set<(state: ElementTrackerState) => void>()
  let state = computeState(el)

  const removeRaf = rafLoop.add(() => {
    const next = computeState(el)
    if (!statesEqual(next, state)) {
      state = next
      subscribers.forEach((cb) => cb(state))
    }
  })

  return {
    getState: () => state,
    subscribe(cb) {
      subscribers.add(cb)
      cb(state)
      return () => subscribers.delete(cb)
    },
    destroy() {
      removeRaf()
      subscribers.clear()
    },
  }
}
