import { useEffect, useMemo, useRef } from 'react'
import {
  createRevealController,
  type RevealController,
  type RevealControllerOptions,
} from '@macrulez/inview-core'

/**
 * Lifecycle wrapper around `createRevealController` — creates the
 * controller in an effect and destroys it automatically on unmount,
 * removing the manual `useEffect` boilerplate a page-wide reveal controller
 * otherwise needs at every call site.
 *
 * `options` are captured once, at the first render, and used for the
 * controller's entire lifetime — the same one-shot option model
 * `createRevealController` itself has, not something that reacts to a
 * changing `options` object on every re-render.
 *
 * ```tsx
 * useRevealController({ stagger: { step: 70, max: 4 } })
 * ```
 */
export function useRevealController(options?: RevealControllerOptions): RevealController {
  const controllerRef = useRef<RevealController | null>(null)

  useEffect(() => {
    const controller = createRevealController(options)
    controllerRef.current = controller
    return () => {
      controller.destroy()
      controllerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return useMemo(
    () => ({
      refresh(selector?: string) {
        controllerRef.current?.refresh(selector)
      },
      observe(el: Element) {
        controllerRef.current?.observe(el)
      },
      unobserve(el: Element) {
        controllerRef.current?.unobserve(el)
      },
      destroy() {
        controllerRef.current?.destroy()
        controllerRef.current = null
      },
    }),
    []
  )
}
