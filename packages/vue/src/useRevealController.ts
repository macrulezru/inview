import { onMounted, onUnmounted } from 'vue'
import {
  createRevealController,
  type RevealController,
  type RevealControllerOptions,
} from '@macrulez/inview-core'

/**
 * Lifecycle wrapper around `createRevealController` — creates the
 * controller once the component is actually mounted (so its own
 * `.reveal`/`[data-reveal]` elements exist in the DOM to be scanned) and
 * destroys it automatically on unmount, removing the manual
 * `onMounted`/`onUnmounted` boilerplate a page-wide reveal controller
 * otherwise needs at every call site.
 *
 * `options` are captured once and used for the controller's entire
 * lifetime — the same one-shot option model `createRevealController` itself
 * has, not a reactive `ref`/getter.
 *
 * ```ts
 * useRevealController({ stagger: { step: 70, max: 4 } })
 * ```
 */
export function useRevealController(options?: RevealControllerOptions): RevealController {
  let controller: RevealController | null = null

  onMounted(() => {
    controller = createRevealController(options)
  })

  onUnmounted(() => {
    controller?.destroy()
    controller = null
  })

  return {
    refresh(selector?: string) {
      controller?.refresh(selector)
    },
    observe(el: Element) {
      controller?.observe(el)
    },
    unobserve(el: Element) {
      controller?.unobserve(el)
    },
    destroy() {
      controller?.destroy()
      controller = null
    },
  }
}
