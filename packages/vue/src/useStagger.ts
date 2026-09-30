import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { staggerDelay, type StaggerDelayOptions } from '@macrulez/inview-core'

/**
 * Reactive wrapper around `staggerDelay` — recomputes whenever `index` or
 * `options` (passed as a ref/getter) change, instead of calling
 * `staggerDelay` by hand at every call site of a hand-rolled `v-for` reveal
 * effect.
 *
 * ```ts
 * const delay = useStagger(index, { step: 70, max: 4 })
 * ```
 */
export function useStagger(
  index: MaybeRefOrGetter<number>,
  options?: MaybeRefOrGetter<StaggerDelayOptions | undefined>
): ComputedRef<string> {
  return computed(() => staggerDelay(toValue(index), toValue(options)))
}
