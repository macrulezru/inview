import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { createVisibilityEngine, type IntersectionInfo, type VisibilityHandle } from '@macrulez/inview-core'
import { useInviewDefaults } from './context'

export interface UseElementVisibilityOptions {
  /** default 0. changing this re-subscribes — pool membership is keyed on it, same as `rootMargin`/`root` */
  threshold?: number | number[]
  /** default '0px'. changing this re-subscribes — pool membership is keyed on it, same as `threshold`/`root` */
  rootMargin?: string
  /** changing this re-subscribes — pool membership is keyed on it, same as `threshold`/`rootMargin` */
  root?: HTMLElement | null
  /** default false. updates live on every render, without re-subscribing */
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

// A fresh `[0, 0.5]` array literal every render (the common case for an
// inline threshold) must not force a real re-subscribe on every render just
// because its reference changed — normalized into a primitive string/number
// key, the same way ObserverPool's own pool key already compares thresholds
// by value rather than by reference.
function thresholdKey(threshold: number | number[] | undefined): string | number {
  return Array.isArray(threshold) ? threshold.join(',') : (threshold ?? 0)
}

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
  const handleRef = useRef<VisibilityHandle | null>(null)

  const effectiveThreshold = options.threshold ?? defaults.threshold
  const effectiveRootMargin = options.rootMargin ?? defaults.rootMargin
  const effectiveRoot = options.root ?? null

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      handleRef.current = null

      if (!target || typeof window === 'undefined') {
        stateRef.current = emptyState
        return () => {}
      }

      stateRef.current = emptyState
      const opts = optionsRef.current
      const def = defaultsRef.current
      const handle = engine.observe(
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
      handleRef.current = handle
      return () => {
        handleRef.current = null
        handle()
      }
    },
    // threshold/rootMargin/root determine which pooled IntersectionObserver
    // this subscribes to (see thresholdKey above for why threshold isn't
    // used directly) — changing any of them has to be a real re-subscribe.
    // once/onEnter/onLeave deliberately aren't here: they update live below
    // instead, without tearing this subscription down.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [target, thresholdKey(effectiveThreshold), effectiveRootMargin, effectiveRoot]
  )

  const getSnapshot = useCallback(() => stateRef.current, [])
  const getServerSnapshot = useCallback(() => emptyState, [])

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // once/onEnter/onLeave aren't part of the pool key, so — unlike
  // threshold/rootMargin/root above — they update the live subscription in
  // place on every render instead of forcing a subscribe()/re-observe
  // cycle. Runs unconditionally (no dep array): a fresh onEnter/onLeave
  // closure every render is the normal case in React, and `update()` itself
  // is just a few property assignments, cheap enough to not need memoizing.
  useEffect(() => {
    handleRef.current?.update({
      once: options.once ?? defaults.once,
      onEnter: options.onEnter,
      onLeave: options.onLeave,
    })
  })

  return state
}
