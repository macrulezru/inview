import { onUnmounted, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import {
  createScrollEngine,
  type ScrollDirection,
  type ScrollEngine,
  type ScrollEngineOptions,
  type ScrollToOptions,
} from '@macrulez/inview-core'

export interface UseScrollOptions extends ScrollEngineOptions {}

export interface UseScrollReturn {
  x: Ref<number>
  y: Ref<number>
  direction: Ref<ScrollDirection>
  progress: Ref<number>
  velocity: Ref<number>
  isScrolling: Ref<boolean>
  scrollTo: (pos: number | { x?: number; y?: number }, opts?: ScrollToOptions) => void
}

function defaultTarget(): Window | undefined {
  return typeof window !== 'undefined' ? window : undefined
}

/**
 * Reactive scroll state for the window or a scrollable element.
 * SSR-safe: subscribes lazily once `target` resolves to a real element on the client.
 */
export function useScroll(
  target: MaybeRefOrGetter<Window | HTMLElement | null | undefined> = defaultTarget,
  options: UseScrollOptions = {}
): UseScrollReturn {
  const x = ref(0)
  const y = ref(0)
  const direction = ref<ScrollDirection>(null)
  const progress = ref(0)
  const velocity = ref(0)
  const isScrolling = ref(false)

  let engine: ScrollEngine | null = null
  let unsubscribe: (() => void) | null = null

  function teardown() {
    unsubscribe?.()
    engine?.destroy()
    unsubscribe = null
    engine = null
  }

  function setup() {
    teardown()
    const resolved = toValue(target)
    if (!resolved || typeof window === 'undefined') return
    engine = createScrollEngine(resolved, options)
    unsubscribe = engine.subscribe((state) => {
      x.value = state.x
      y.value = state.y
      direction.value = state.direction
      progress.value = state.progress
      velocity.value = state.velocity
      isScrolling.value = state.isScrolling
    })
  }

  watch(() => toValue(target), setup, { immediate: true })
  onUnmounted(teardown)

  function scrollTo(pos: number | { x?: number; y?: number }, opts?: ScrollToOptions) {
    engine?.scrollTo(pos, opts)
  }

  return { x, y, direction, progress, velocity, isScrolling, scrollTo }
}
