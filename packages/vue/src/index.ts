export { useScroll } from './useScroll'
export type { UseScrollOptions, UseScrollReturn } from './useScroll'

export { useElementVisibility } from './useElementVisibility'
export type { UseElementVisibilityOptions, UseElementVisibilityReturn } from './useElementVisibility'

export { useElementViewport } from './useElementViewport'
export type { UseElementViewportReturn } from './useElementViewport'

export { useParallaxLayer } from './useParallaxLayer'
export type { UseParallaxLayerOptions, UseParallaxLayerReturn } from './useParallaxLayer'

export { setViewportDefaults, viewportDefaults } from './config'
export type { ViewportDefaults } from './config'

export { vReveal } from './vReveal'
export type { RevealDirectiveOptions } from './vReveal'

export { InView } from './InView'

export { useRevealController } from './useRevealController'

export { usePrefersReducedMotion } from './usePrefersReducedMotion'

export { useStagger } from './useStagger'

export { useScrollTo } from './useScrollTo'
export type { UseScrollToOptions } from './useScrollTo'

export { useScrollSpy } from './useScrollSpy'
export type { UseScrollSpyOptions } from './useScrollSpy'

// Every @macrulez/inview-core export — createScrollEngine,
// createVisibilityEngine, createElementTracker, ObserverPool/observerPool,
// rafLoop, createRevealController, staggerDelay, the utilities, and their
// types — is re-exported here too, so installing just @macrulez/inview-vue
// reaches the framework-agnostic layer directly (e.g.
// createRevealController for a page-wide "class=reveal, anywhere in the
// DOM, including elements that don't exist yet" pass) without a separate
// dependency on @macrulez/inview-core.
export * from '@macrulez/inview-core'
