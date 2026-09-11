import { onUnmounted, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { createVisibilityEngine, type IntersectionInfo } from '@macrulez/inview-core'
import { viewportDefaults } from './config'

export interface UseElementVisibilityOptions {
  /** default 0 */
  threshold?: number | number[]
  /** default '0px' */
  rootMargin?: string
  root?: MaybeRefOrGetter<HTMLElement | null | undefined>
  /** default false */
  once?: boolean
  onEnter?: (info: IntersectionInfo) => void
  onLeave?: (info: IntersectionInfo) => void
}

export interface UseElementVisibilityReturn {
  isVisible: Ref<boolean>
  ratio: Ref<number>
}

// Shared across every useElementVisibility() call so elements with matching
// threshold/root/rootMargin reuse a single IntersectionObserver.
const engine = createVisibilityEngine()

/**
 * Reactive IntersectionObserver-backed visibility of an element.
 * SSR-safe: observation starts once `target` resolves to a real element on the client.
 */
export function useElementVisibility(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UseElementVisibilityOptions = {}
): UseElementVisibilityReturn {
  const isVisible = ref(false)
  const ratio = ref(0)

  let stop: (() => void) | null = null

  function teardown() {
    stop?.()
    stop = null
  }

  function setup() {
    teardown()
    const el = toValue(target)
    if (!el || typeof window === 'undefined') return

    stop = engine.observe(
      el,
      {
        threshold: options.threshold ?? viewportDefaults.threshold,
        rootMargin: options.rootMargin ?? viewportDefaults.rootMargin,
        root: toValue(options.root) ?? null,
        once: options.once ?? viewportDefaults.once,
        onEnter: options.onEnter,
        onLeave: options.onLeave,
      },
      (info) => {
        isVisible.value = info.isIntersecting
        ratio.value = info.intersectionRatio
      }
    )
  }

  watch(() => [toValue(target), toValue(options.root)] as const, setup, { immediate: true })
  onUnmounted(teardown)

  return { isVisible, ratio }
}
