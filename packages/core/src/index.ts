export { createScrollEngine } from './scroll-engine'
export { createVisibilityEngine } from './visibility-engine'
export { createElementTracker } from './element-tracker'
export { observerPool, ObserverPool } from './observer-pool'
export type { ObserverPoolStat } from './observer-pool'
export { rafLoop } from './raf-loop'
export { createRevealController } from './reveal-controller'
export type { RevealController, RevealControllerOptions, RevealStaggerOptions } from './reveal-controller'
export { createScrollSpy } from './scroll-spy'
export type { ScrollSpy, ScrollSpyOptions } from './scroll-spy'

export { mapRange } from './utils/mapRange'
export { bindCSSVar } from './utils/bindCSSVar'
export { prefersReducedMotion } from './utils/prefersReducedMotion'
export { clamp } from './utils/clamp'
export { staggerDelay } from './utils/staggerDelay'
export type { StaggerDelayOptions } from './utils/staggerDelay'
export { scrollToElement } from './utils/scrollToElement'
export type { ScrollToElementOptions } from './utils/scrollToElement'
export { easings } from './easing'
export type { Easing, EasingName } from './easing'

export type {
  ScrollDirection,
  ScrollState,
  ScrollToOptions,
  ScrollEngineOptions,
  ScrollEngine,
  IntersectionEdge,
  IntersectionInfo,
  ObserverPoolOptions,
  VisibilityObserveOptions,
  VisibilityLiveOptions,
  VisibilityHandle,
  VisibilityEngine,
  DOMRectLike,
  ElementTrackerState,
  ElementTrackerOptions,
  ElementTracker,
} from './types'
