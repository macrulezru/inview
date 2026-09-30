export { useScroll } from './useScroll'
export type { UseScrollOptions, UseScrollReturn } from './useScroll'

export { useElementVisibility } from './useElementVisibility'
export type { UseElementVisibilityOptions, UseElementVisibilityReturn } from './useElementVisibility'

export { InviewProvider, useInviewDefaults } from './context'
export type { ViewportDefaults, InviewProviderProps } from './context'

export { InView } from './InView'
export type { InViewProps } from './InView'

export { useElementViewport } from './useElementViewport'
export type { UseElementViewportReturn } from './useElementViewport'

export { useParallaxLayer } from './useParallaxLayer'
export type { UseParallaxLayerOptions, UseParallaxLayerReturn } from './useParallaxLayer'

export { useReveal } from './useReveal'
export type { UseRevealOptions, UseRevealReturn } from './useReveal'

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
// types — is re-exported here too, so installing just @macrulez/inview-react
// reaches the framework-agnostic layer directly (e.g.
// createRevealController for a page-wide "class=reveal, anywhere in the
// DOM, including elements that don't exist yet" pass — there's no React
// hook for this, since it isn't per-component state at all) without a
// separate dependency on @macrulez/inview-core.
export * from '@macrulez/inview-core'
