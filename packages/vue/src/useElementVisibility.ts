import { onUnmounted, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { createVisibilityEngine, type IntersectionInfo, type VisibilityHandle } from '@macrulez/inview-core'
import { viewportDefaults } from './config'

export interface UseElementVisibilityOptions {
  /** default 0. changing this re-subscribes — pool membership is keyed on it, same as `rootMargin`/`root` */
  threshold?: MaybeRefOrGetter<number | number[] | undefined>
  /** default '0px'. changing this re-subscribes — pool membership is keyed on it, same as `threshold`/`root` */
  rootMargin?: MaybeRefOrGetter<string | undefined>
  /** changing this re-subscribes — pool membership is keyed on it, same as `threshold`/`rootMargin` */
  root?: MaybeRefOrGetter<HTMLElement | null | undefined>
  /** default false. updates live, without re-subscribing, when passed as a ref/getter */
  once?: MaybeRefOrGetter<boolean | undefined>
  /**
   * Not reactive — same convention as the rest of this package's composables
   * (see `v-reveal`'s shallow-compare notes): a callback closing over a ref's
   * `.value` already reads it fresh on every call, so there's nothing for a
   * `MaybeRefOrGetter` wrapper to add here, unlike `once`/`threshold`/etc.
   */
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

  let handle: VisibilityHandle | null = null

  function teardown() {
    handle?.()
    handle = null
  }

  function setup() {
    teardown()
    const el = toValue(target)
    if (!el || typeof window === 'undefined') return

    handle = engine.observe(
      el,
      {
        threshold: toValue(options.threshold) ?? viewportDefaults.threshold,
        rootMargin: toValue(options.rootMargin) ?? viewportDefaults.rootMargin,
        root: toValue(options.root) ?? null,
        once: toValue(options.once) ?? viewportDefaults.once,
        onEnter: options.onEnter,
        onLeave: options.onLeave,
      },
      (info) => {
        isVisible.value = info.isIntersecting
        ratio.value = info.intersectionRatio
      }
    )
  }

  // threshold/rootMargin/root determine which pooled IntersectionObserver
  // this subscribes to — changing any of them has to be a real re-subscribe.
  watch(
    () => [toValue(target), toValue(options.root), toValue(options.threshold), toValue(options.rootMargin)] as const,
    setup,
    { immediate: true }
  )

  // `once` isn't part of the pool key, so it updates the live subscription
  // in place instead of tearing down and recreating it — only fires when
  // `options.once` is actually a ref/getter someone is reactively changing;
  // a plain boolean here never triggers this (nothing reactive to track).
  watch(
    () => toValue(options.once),
    (once) => {
      handle?.update({ once: once ?? viewportDefaults.once, onEnter: options.onEnter, onLeave: options.onLeave })
    }
  )

  onUnmounted(teardown)

  return { isVisible, ratio }
}
