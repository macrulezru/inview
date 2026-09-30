import { onUnmounted, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { createElementTracker, type DOMRectLike, type ElementTracker } from '@macrulez/inview-core'

export interface UseElementViewportOptions {
  /**
   * Measures viewportProgress/distanceFromCenter relative to this
   * scrollable container instead of the window — for an element scrolling
   * inside `overflow: auto` (a dashboard panel, a modal). default null (window)
   */
  root?: MaybeRefOrGetter<HTMLElement | null | undefined>
}

export interface UseElementViewportReturn {
  rect: Ref<DOMRectLike>
  /** 0..1, from element entering at viewport bottom to leaving at viewport top */
  viewportProgress: Ref<number>
  distanceFromCenter: Ref<number>
}

const emptyRect: DOMRectLike = { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }

/**
 * Reactive position of an element relative to the viewport — rect,
 * viewportProgress and distanceFromCenter, updated on the shared rAF loop.
 */
export function useElementViewport(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UseElementViewportOptions = {}
): UseElementViewportReturn {
  const rect = ref<DOMRectLike>(emptyRect)
  const viewportProgress = ref(0)
  const distanceFromCenter = ref(0)

  let tracker: ElementTracker | null = null
  let unsubscribe: (() => void) | null = null

  function teardown() {
    unsubscribe?.()
    tracker?.destroy()
    unsubscribe = null
    tracker = null
  }

  function setup() {
    teardown()
    const el = toValue(target)
    if (!el || typeof window === 'undefined') return

    tracker = createElementTracker(el, { root: toValue(options.root) ?? null })
    unsubscribe = tracker.subscribe((state) => {
      rect.value = state.rect
      viewportProgress.value = state.viewportProgress
      distanceFromCenter.value = state.distanceFromCenter
    })
  }

  watch(() => [toValue(target), toValue(options.root)] as const, setup, { immediate: true })
  onUnmounted(teardown)

  return { rect, viewportProgress, distanceFromCenter }
}
