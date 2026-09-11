import { createElement, useState, type JSX, type ReactNode } from 'react'
import type { IntersectionInfo } from '@macrulez/inview-core'
import { useElementVisibility } from './useElementVisibility'

export interface InViewProps {
  once?: boolean
  threshold?: number | number[]
  rootMargin?: string
  root?: HTMLElement | null
  /** tag for the measured wrapper element. default 'div' */
  as?: keyof JSX.IntrinsicElements
  onEnter?: (info: IntersectionInfo) => void
  onLeave?: (info: IntersectionInfo) => void
  children: (state: { isVisible: boolean; ratio: number }) => ReactNode
}

/**
 * Render-prop wrapper around useElementVisibility for the cases where the
 * reactive `isVisible`/`ratio` value is needed back in JSX (e.g. to lazily
 * mount a heavy child) rather than a plain class toggle — 1:1 with the Vue
 * adapter's `<InView>`, just `children` as a function instead of a slot.
 *
 * Always renders one real wrapping element (`as`, default 'div') since an
 * IntersectionObserver needs an actual element to measure.
 *
 * ```tsx
 * <InView once>{({ isVisible }) => (isVisible ? <Heavy /> : null)}</InView>
 * ```
 */
export function InView(props: InViewProps) {
  const { once, threshold, rootMargin, root, as = 'div', onEnter, onLeave, children } = props
  const [node, setNode] = useState<HTMLElement | null>(null)
  const { isVisible, ratio } = useElementVisibility(node, {
    once,
    threshold,
    rootMargin,
    root,
    onEnter,
    onLeave,
  })

  return createElement(as, { ref: setNode }, children({ isVisible, ratio }))
}
