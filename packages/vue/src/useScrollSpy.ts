import { onUnmounted, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { createScrollSpy, type ScrollSpy, type ScrollSpyOptions } from '@macrulez/inview-core'

export interface UseScrollSpyOptions extends ScrollSpyOptions {}

/**
 * Reactively tracks which of `targets` currently sits in the "active" band
 * (see `ScrollSpyOptions.rootMargin`) and returns its index — the
 * nav-highlight case built entirely on the pooled visibility engine, one
 * `IntersectionObserver` shared across every target.
 *
 * ```vue
 * <script setup>
 * const sections = useTemplateRef('sections') // an array of elements from v-for
 * const activeIndex = useScrollSpy(sections)
 * </script>
 * ```
 *
 * `options` are captured once per `setup()` re-run (triggered when
 * `targets` itself changes), the same one-shot model `createRevealController`
 * has — not a reactive `ref`/getter.
 */
export function useScrollSpy(
  targets: MaybeRefOrGetter<Array<HTMLElement | null | undefined>>,
  options: UseScrollSpyOptions = {}
): Ref<number | null> {
  const activeIndex = ref<number | null>(null)

  let spy: ScrollSpy | null = null

  function teardown() {
    spy?.destroy()
    spy = null
  }

  function setup() {
    teardown()
    if (typeof window === 'undefined') return
    const els = toValue(targets)
    if (els.length === 0) return

    spy = createScrollSpy(els, options, (index) => {
      activeIndex.value = index
    })
  }

  watch(() => toValue(targets), setup, { immediate: true, deep: true })
  onUnmounted(teardown)

  return activeIndex
}
