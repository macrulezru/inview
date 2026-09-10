import { useCallback, useRef, useSyncExternalStore } from 'react'
import { createElementTracker, type ElementTrackerState } from '@macrulez/inview-core'

export type UseElementViewportReturn = ElementTrackerState

const emptyRect = { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }
const emptyState: UseElementViewportReturn = { rect: emptyRect, viewportProgress: 0, distanceFromCenter: 0 }

/**
 * Reactive position of an element relative to the viewport — rect,
 * viewportProgress and distanceFromCenter, updated on the shared rAF loop.
 */
export function useElementViewport(target: HTMLElement | null): UseElementViewportReturn {
  const stateRef = useRef<UseElementViewportReturn>(emptyState)

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!target || typeof window === 'undefined') {
        stateRef.current = emptyState
        return () => {}
      }

      const tracker = createElementTracker(target)
      const unsubscribe = tracker.subscribe((state) => {
        stateRef.current = state
        onStoreChange()
      })
      return () => {
        unsubscribe()
        tracker.destroy()
      }
    },
    [target]
  )

  const getSnapshot = useCallback(() => stateRef.current, [])
  const getServerSnapshot = useCallback(() => emptyState, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
