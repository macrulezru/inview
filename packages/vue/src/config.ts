export interface ViewportDefaults {
  threshold: number | number[]
  rootMargin: string
  /** default false — a plain useElementVisibility() call stays continuous unless told otherwise */
  once: boolean
}

/**
 * Package-wide defaults for useElementVisibility (and v-reveal/<InView>,
 * which read the same object), overridable at the app level (e.g. by
 * @macrulez/inview-nuxt's module options) without having to pass the same
 * options to every call site.
 */
export const viewportDefaults: ViewportDefaults = {
  threshold: 0,
  rootMargin: '0px',
  once: false,
}

export function setViewportDefaults(overrides: Partial<ViewportDefaults>): void {
  if (overrides.threshold !== undefined) viewportDefaults.threshold = overrides.threshold
  if (overrides.rootMargin !== undefined) viewportDefaults.rootMargin = overrides.rootMargin
  if (overrides.once !== undefined) viewportDefaults.once = overrides.once
}
