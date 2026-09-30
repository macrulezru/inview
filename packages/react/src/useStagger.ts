import { staggerDelay, type StaggerDelayOptions } from '@macrulez/inview-core'

/**
 * Thin wrapper around `staggerDelay` for parity with the Vue adapter's
 * `useStagger` — the computation itself is cheap enough (plain arithmetic)
 * that it doesn't need `useMemo`; it's just called directly every render.
 *
 * ```tsx
 * const delay = useStagger(index, { step: 70, max: 4 })
 * ```
 */
export function useStagger(index: number, options?: StaggerDelayOptions): string {
  return staggerDelay(index, options)
}
