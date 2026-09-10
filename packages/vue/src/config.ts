export interface ViewportDefaults {
  threshold: number | number[]
  rootMargin: string
}

/**
 * Package-wide defaults for useElementVisibility, overridable at the app
 * level (e.g. by @macrulez/inview-nuxt's module options) without having
 * to pass the same options to every call site.
 */
export const viewportDefaults: ViewportDefaults = {
  threshold: 0,
  rootMargin: '0px',
}

export function setViewportDefaults(overrides: Partial<ViewportDefaults>): void {
  if (overrides.threshold !== undefined) viewportDefaults.threshold = overrides.threshold
  if (overrides.rootMargin !== undefined) viewportDefaults.rootMargin = overrides.rootMargin
}
