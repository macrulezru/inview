export interface StaggerDelayOptions {
  /** ms of delay per step. default 60 */
  step?: number
  /** caps the index used for the delay, so item 50 in a long list doesn't wait almost a second. default Infinity */
  max?: number
  /** unit suffix on the returned string. default 'ms' */
  unit?: 'ms' | 's'
}

/**
 * Computes a CSS transition-delay for the `index`-th element in a staggered
 * reveal (grid/list items fading in one after another), so callers don't
 * hand-roll `Math.min(i, max) * step` themselves at every call site.
 */
export function staggerDelay(index: number, options: StaggerDelayOptions = {}): string {
  const { step = 60, max = Infinity, unit = 'ms' } = options
  const ms = Math.max(0, Math.min(index, max)) * step
  return unit === 's' ? `${ms / 1000}s` : `${ms}ms`
}
