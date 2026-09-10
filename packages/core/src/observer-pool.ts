import type { ObserverPoolOptions } from './types'

type EntryCallback = (entry: IntersectionObserverEntry) => void

interface Pool {
  observer: IntersectionObserver
  callbacks: Map<Element, Set<EntryCallback>>
}

function keyFor(options: ObserverPoolOptions): string {
  const threshold = Array.isArray(options.threshold) ? options.threshold.join(',') : String(options.threshold ?? 0)
  const root = options.root ? 'r' : 'window'
  return `${root}|${options.rootMargin ?? '0px'}|${threshold}`
}

/**
 * Pools IntersectionObserver instances by (root, rootMargin, threshold),
 * so many observed elements sharing the same options share one observer
 * instead of spawning one per element.
 */
export class ObserverPool {
  private pools = new Map<string, Pool>()

  observe(el: Element, options: ObserverPoolOptions, cb: EntryCallback): () => void {
    if (typeof IntersectionObserver === 'undefined') return () => {}

    const key = keyFor(options)
    let pool = this.pools.get(key)
    if (!pool) {
      const callbacks = new Map<Element, Set<EntryCallback>>()
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            callbacks.get(entry.target)?.forEach((fn) => fn(entry))
          }
        },
        {
          root: options.root ?? null,
          rootMargin: options.rootMargin ?? '0px',
          threshold: options.threshold ?? 0,
        }
      )
      pool = { observer, callbacks }
      this.pools.set(key, pool)
    }

    let callbacks = pool.callbacks.get(el)
    if (!callbacks) {
      callbacks = new Set()
      pool.callbacks.set(el, callbacks)
    }
    const isNewElement = callbacks.size === 0
    callbacks.add(cb)
    if (isNewElement) pool.observer.observe(el)

    const currentPool = pool
    return () => {
      const set = currentPool.callbacks.get(el)
      if (!set) return
      set.delete(cb)
      if (set.size === 0) {
        currentPool.callbacks.delete(el)
        currentPool.observer.unobserve(el)
      }
      if (currentPool.callbacks.size === 0) {
        currentPool.observer.disconnect()
        this.pools.delete(key)
      }
    }
  }
}

export const observerPool = new ObserverPool()
