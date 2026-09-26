export type ScrollDirection = 'up' | 'down' | 'left' | 'right' | null

export interface ScrollState {
  x: number
  y: number
  direction: ScrollDirection
  /** 0..1 */
  progress: number
  /** px per frame */
  velocity: number
  isScrolling: boolean
}

export interface ScrollToOptions {
  behavior?: 'auto' | 'smooth'
}

export interface ScrollEngineOptions {
  /** ms of scroll inactivity before isScrolling flips back to false */
  idleTimeout?: number
}

export interface ScrollEngine {
  getState(): ScrollState
  /** returns unsubscribe */
  subscribe(cb: (state: ScrollState) => void): () => void
  scrollTo(pos: number | { x?: number; y?: number }, opts?: ScrollToOptions): void
  destroy(): void
}

export type IntersectionEdge = 'enter-top' | 'enter-bottom' | 'leave-top' | 'leave-bottom'

export interface IntersectionInfo {
  isIntersecting: boolean
  intersectionRatio: number
  boundingClientRect: DOMRectReadOnly
  edge?: IntersectionEdge
}

export interface ObserverPoolOptions {
  root?: Element | Document | null
  rootMargin?: string
  threshold?: number | number[]
}

export interface VisibilityObserveOptions extends ObserverPoolOptions {
  once?: boolean
  onEnter?: (info: IntersectionInfo) => void
  onLeave?: (info: IntersectionInfo) => void
}

/**
 * The subset of `VisibilityObserveOptions` a `VisibilityHandle.update()` can
 * change without tearing down and recreating the underlying pooled
 * `IntersectionObserver` subscription. `root`/`rootMargin`/`threshold`
 * aren't here on purpose — pool membership is keyed on them (see
 * `ObserverPool`), so changing them genuinely requires a fresh `observe()`
 * call, not a live update.
 */
export interface VisibilityLiveOptions {
  once?: boolean
  onEnter?: (info: IntersectionInfo) => void
  onLeave?: (info: IntersectionInfo) => void
}

/**
 * Callable exactly like the plain unsubscribe function this used to be
 * (`handle()` still tears down the observation) — `update()` is additive,
 * so existing code that only ever calls the return value as a function
 * keeps working unchanged.
 */
export interface VisibilityHandle {
  (): void
  /**
   * Replaces `once`/`onEnter`/`onLeave` wholesale, without re-subscribing —
   * pass the full current set of live values, not a sparse patch. Omitting
   * a field here clears it to `undefined`; it does not leave whatever was
   * previously set in place.
   */
  update(options: VisibilityLiveOptions): void
}

export interface VisibilityEngine {
  observe(el: Element, options: VisibilityObserveOptions, cb: (info: IntersectionInfo) => void): VisibilityHandle
  destroy(): void
}

export interface DOMRectLike {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

export interface ElementTrackerState {
  rect: DOMRectLike
  /** 0..1, from element entering at viewport bottom to leaving at viewport top */
  viewportProgress: number
  /** px offset of element center from viewport center */
  distanceFromCenter: number
}

export interface ElementTrackerOptions {
  /**
   * Measures `viewportProgress`/`distanceFromCenter` relative to this
   * scrollable container's bounding rect instead of the window — for an
   * element scrolling inside `overflow: auto` (a dashboard panel, a modal),
   * where the window's own dimensions aren't the relevant "viewport" at
   * all. `rect` itself stays the element's plain (window-relative)
   * `getBoundingClientRect()` either way. default null (window)
   */
  root?: Element | null
}

export interface ElementTracker {
  getState(): ElementTrackerState
  subscribe(cb: (state: ElementTrackerState) => void): () => void
  destroy(): void
}
