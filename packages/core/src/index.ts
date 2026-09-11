export { createScrollEngine } from './scroll-engine'
export { createVisibilityEngine } from './visibility-engine'
export { createElementTracker } from './element-tracker'
export { observerPool, ObserverPool } from './observer-pool'
export { rafLoop } from './raf-loop'
export { createRevealController } from './reveal-controller'
export type { RevealController, RevealControllerOptions, RevealStaggerOptions } from './reveal-controller'

export { mapRange } from './utils/mapRange'
export { bindCSSVar } from './utils/bindCSSVar'
export { prefersReducedMotion } from './utils/prefersReducedMotion'
export { clamp } from './utils/clamp'
export { staggerDelay } from './utils/staggerDelay'
export type { StaggerDelayOptions } from './utils/staggerDelay'
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
  VisibilityEngine,
  DOMRectLike,
  ElementTrackerState,
  ElementTracker,
} from './types'
