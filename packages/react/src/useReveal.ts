import { useEffect } from 'react'
import type { IntersectionInfo } from '@macrulez/inview-core'
import { useElementVisibility } from './useElementVisibility'

export interface UseRevealOptions {
  /** class toggled on the element as it enters the viewport. default 'in'. pass null to disable. */
  activeClass?: string | null
  /** boolean data-attribute set alongside activeClass, for pure-CSS attribute selectors */
  activeAttribute?: string | null
  /** default false */
  once?: boolean
  threshold?: number | number[]
  rootMargin?: string
  root?: HTMLElement | null
  onEnter?: (info: IntersectionInfo) => void
  onLeave?: (info: IntersectionInfo) => void
}

export interface UseRevealReturn {
  isVisible: boolean
  ratio: number
}

/**
 * React's equivalent of the Vue adapter's `v-reveal` directive: wraps
 * `useElementVisibility` and additionally toggles a class (default `"in"`)
 * and/or a data-attribute on `target` as it enters the viewport, so callers
 * don't have to hand-roll `classList.toggle` themselves in an effect for the
 * common "just flip a class" case — `useElementVisibility` on its own is
 * still there for anything more custom than a class/attribute toggle.
 *
 * ```tsx
 * const [el, setEl] = useState<HTMLElement | null>(null)
 * useReveal(el, { once: true })
 * return <div ref={setEl}>...</div>
 * ```
 */
export function useReveal(target: HTMLElement | null, options: UseRevealOptions = {}): UseRevealReturn {
  const activeClass = options.activeClass === undefined ? 'in' : options.activeClass
  const activeAttribute = options.activeAttribute ?? null

  const { isVisible, ratio } = useElementVisibility(target, {
    once: options.once,
    threshold: options.threshold,
    rootMargin: options.rootMargin,
    root: options.root,
    onEnter: options.onEnter,
    onLeave: options.onLeave,
  })

  useEffect(() => {
    if (!target) return
    if (activeClass) target.classList.toggle(activeClass, isVisible)
    if (activeAttribute) {
      if (isVisible) target.setAttribute(activeAttribute, '')
      else target.removeAttribute(activeAttribute)
    }
  }, [target, isVisible, activeClass, activeAttribute])

  return { isVisible, ratio }
}
