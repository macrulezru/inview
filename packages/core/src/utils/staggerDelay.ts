export interface StaggerDelayOptions {
  /** ms of delay per step. default 60 */
  step?: number
  /** caps the index used for the delay, so item 50 in a long list doesn't wait almost a second. default Infinity */
  max?: number
  /** unit suffix on the returned string. default 'ms' */
  unit?: 'ms' | 's'
  /**
   * 'linear' (default) grows then flattens at `max` — the classic
   * reveal-on-scroll ceiling. 'cycle' wraps back to 0 once past `max`,
   * producing a repeating wave (0,1,2,3,0,1,2,3,...) for long lists/grids
   * instead of everything past index `max` sharing the same delay.
   */
  mode?: 'linear' | 'cycle'
}

/**
 * Computes a CSS transition-delay for the `index`-th element in a staggered
 * reveal (grid/list items fading in one after another), so callers don't
 * hand-roll `Math.min(i, max) * step` themselves at every call site.
 */
export function staggerDelay(index: number, options: StaggerDelayOptions = {}): string {
  const { step = 60, max = Infinity, unit = 'ms', mode = 'linear' } = options
  const clampedIndex = Math.max(0, index)
  const effectiveIndex =
    mode === 'cycle' && Number.isFinite(max) ? clampedIndex % (max + 1) : Math.min(clampedIndex, max)
  const ms = effectiveIndex * step
  return unit === 's' ? `${ms / 1000}s` : `${ms}ms`
}
