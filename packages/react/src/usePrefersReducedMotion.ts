import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onStoreChange)
  return () => mql.removeEventListener('change', onStoreChange)
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(QUERY).matches
}

function getServerSnapshot(): boolean {
  return false
}

/**
 * Reactive `prefers-reduced-motion: reduce`, unlike `@macrulez/inview-core`'s
 * static `prefersReducedMotion()` — that one-shot check doesn't notice the OS
 * setting changing mid-session unless something else happens to re-invoke
 * it. Subscribes to the media query's own `change` event via
 * `useSyncExternalStore`, the same pattern the rest of this package's hooks
 * use. SSR-safe: returns `false` on the server.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
