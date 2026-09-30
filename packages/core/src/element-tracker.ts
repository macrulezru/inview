import { rafLoop } from './raf-loop'
import { clamp } from './utils/clamp'
import type { DOMRectLike, ElementTracker, ElementTrackerOptions, ElementTrackerState } from './types'

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

// The "viewport" frame progress/distanceFromCenter are measured against —
// window (frameTop 0, window.innerHeight) by default, or `root`'s own
// bounding rect when tracking inside a scroll container. `rect` itself
// (returned as-is in ElementTrackerState) always stays the element's plain,
// window-relative getBoundingClientRect() regardless of `root`.
function getFrame(root: Element | null): { top: number; height: number } {
  if (!root) return { top: 0, height: window.innerHeight }
  const rect = root.getBoundingClientRect()
  return { top: rect.top, height: rect.height }
}

function computeViewportProgress(rect: DOMRect, frame: { top: number; height: number }): number {
  const total = frame.height + rect.height
  if (total <= 0) return 0
  const traveled = frame.height - (rect.top - frame.top)
  return clamp(traveled / total, 0, 1)
}

function computeState(el: HTMLElement, root: Element | null): ElementTrackerState {
  const rect = el.getBoundingClientRect()
  const frame = getFrame(root)
  const elementCenter = rect.top - frame.top + rect.height / 2
  const frameCenter = frame.height / 2
  return {
    rect: toDomRectLike(rect),
    viewportProgress: computeViewportProgress(rect, frame),
    distanceFromCenter: elementCenter - frameCenter,
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
 * Tracks an element's position relative to the viewport — or, with `root`,
 * relative to a scrollable container's bounding rect instead — on the
 * shared rAF loop.
 */
export function createElementTracker(el: HTMLElement, options: ElementTrackerOptions = {}): ElementTracker {
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

  const root = options.root ?? null
  const subscribers = new Set<(state: ElementTrackerState) => void>()
  let state = computeState(el, root)

  const removeRaf = rafLoop.add(() => {
    const next = computeState(el, root)
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
