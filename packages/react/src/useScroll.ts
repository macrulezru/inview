import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import {
  createScrollEngine,
  type ScrollDirection,
  type ScrollEngine,
  type ScrollEngineOptions,
  type ScrollToOptions,
} from '@macrulez/inview-core'

export interface UseScrollOptions extends ScrollEngineOptions {}

export interface UseScrollReturn {
  x: number
  y: number
  direction: ScrollDirection
  progress: number
  velocity: number
  isScrolling: boolean
  scrollTo: (pos: number | { x?: number; y?: number }, opts?: ScrollToOptions) => void
}

const noopState = { x: 0, y: 0, direction: null as ScrollDirection, progress: 0, velocity: 0, isScrolling: false }

function defaultTarget(): Window | undefined {
  return typeof window !== 'undefined' ? window : undefined
}

/**
 * Reactive scroll state for the window or a scrollable element.
 * SSR-safe: returns a static snapshot on the server, subscribes on the client.
 */
export function useScroll(
  target: Window | HTMLElement | null | undefined = defaultTarget(),
  options: UseScrollOptions = {}
): UseScrollReturn {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const engineHolder = useRef<{ target: typeof target; engine: ScrollEngine | null }>({
    target: undefined,
    engine: null,
  })

  function ensureEngine() {
    if (engineHolder.current.target !== target) {
      engineHolder.current.engine?.destroy()
      engineHolder.current = {
        target,
        engine: target && typeof window !== 'undefined' ? createScrollEngine(target, optionsRef.current) : null,
      }
    }
    return engineHolder.current.engine
  }

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const engine = ensureEngine()
      return engine ? engine.subscribe(() => onStoreChange()) : () => {}
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [target]
  )

  const getSnapshot = useCallback(
    () => {
      const engine = ensureEngine()
      return engine ? engine.getState() : noopState
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [target]
  )

  const getServerSnapshot = useCallback(() => noopState, [])

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const scrollTo = useCallback((pos: number | { x?: number; y?: number }, opts?: ScrollToOptions) => {
    engineHolder.current.engine?.scrollTo(pos, opts)
  }, [])

  useEffect(
    () => () => {
      engineHolder.current.engine?.destroy()
      engineHolder.current = { target: undefined, engine: null }
    },
    []
  )

  return { ...state, scrollTo }
}
