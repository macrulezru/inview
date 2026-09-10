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

export interface VisibilityEngine {
  /** returns unsubscribe */
  observe(el: Element, options: VisibilityObserveOptions, cb: (info: IntersectionInfo) => void): () => void
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

export interface ElementTracker {
  getState(): ElementTrackerState
  subscribe(cb: (state: ElementTrackerState) => void): () => void
  destroy(): void
}
