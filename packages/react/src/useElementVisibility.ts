import { useCallback, useRef, useSyncExternalStore } from 'react'
import { createVisibilityEngine, type IntersectionInfo } from '@macrulez/inview-core'
import { useInviewDefaults } from './context'

export interface UseElementVisibilityOptions {
  /** default 0 */
  threshold?: number | number[]
  /** default '0px' */
  rootMargin?: string
  root?: HTMLElement | null
  /** default false */
  once?: boolean
  onEnter?: (info: IntersectionInfo) => void
  onLeave?: (info: IntersectionInfo) => void
}

export interface UseElementVisibilityReturn {
  isVisible: boolean
  ratio: number
}

const emptyState: UseElementVisibilityReturn = { isVisible: false, ratio: 0 }

// Shared across every useElementVisibility() call so elements with matching
// threshold/root/rootMargin reuse a single IntersectionObserver.
const engine = createVisibilityEngine()

/**
 * Reactive IntersectionObserver-backed visibility of an element.
 * SSR-safe: returns a static snapshot on the server, observes on the client.
 */
export function useElementVisibility(
  target: HTMLElement | null,
  options: UseElementVisibilityOptions = {}
): UseElementVisibilityReturn {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const defaults = useInviewDefaults()
  const defaultsRef = useRef(defaults)
  defaultsRef.current = defaults

  const stateRef = useRef<UseElementVisibilityReturn>(emptyState)

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!target || typeof window === 'undefined') {
        stateRef.current = emptyState
        return () => {}
      }

      stateRef.current = emptyState
      const opts = optionsRef.current
      const def = defaultsRef.current
      const unobserve = engine.observe(
        target,
        {
          threshold: opts.threshold ?? def.threshold,
          rootMargin: opts.rootMargin ?? def.rootMargin,
          root: opts.root ?? null,
          once: opts.once ?? def.once,
          onEnter: opts.onEnter,
          onLeave: opts.onLeave,
        },
        (info) => {
          stateRef.current = { isVisible: info.isIntersecting, ratio: info.intersectionRatio }
          onStoreChange()
        }
      )
      return unobserve
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [target]
  )

  const getSnapshot = useCallback(() => stateRef.current, [])
  const getServerSnapshot = useCallback(() => emptyState, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
