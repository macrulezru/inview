import { onUnmounted, ref, type Ref } from 'vue'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Reactive `prefers-reduced-motion: reduce`, unlike `@macrulez/inview-core`'s
 * static `prefersReducedMotion()` — that one-shot check doesn't notice the OS
 * setting changing mid-session unless something else happens to re-invoke
 * it. Subscribes to the media query's own `change` event and updates the
 * returned ref accordingly; unsubscribes automatically on unmount.
 */
export function usePrefersReducedMotion(): Ref<boolean> {
  const supported = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  const mql = supported ? window.matchMedia(QUERY) : null
  const prefersReducedMotion = ref(mql?.matches ?? false)

  if (mql) {
    const onChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion.value = event.matches
    }
    mql.addEventListener('change', onChange)
    onUnmounted(() => mql.removeEventListener('change', onChange))
  }

  return prefersReducedMotion
}
