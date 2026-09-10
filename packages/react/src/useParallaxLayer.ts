import { useMemo } from 'react'
import { mapRange, prefersReducedMotion, type Easing } from '@macrulez/inview-core'
import { useElementViewport } from './useElementViewport'

export interface UseParallaxLayerOptions {
  /** relative speed: 1 moves with scroll, >1 faster, <1 slower, negative reverses direction */
  speed: number
  /** default 'y' */
  axis?: 'x' | 'y'
  /** clamp the offset at the 0/1 progress edges instead of extrapolating, default false */
  clamp?: boolean
  /** applied to viewportProgress before mapping it to an offset */
  easing?: Easing
  /** px offset amplitude at speed 1, default 100 */
  range?: number
}

export interface UseParallaxLayerReturn {
  style: { transform: string }
  progress: number
}

/**
 * Ready-made "layer with its own scroll speed" primitive: maps the element's
 * viewportProgress into a CSS transform offset, honoring prefers-reduced-motion.
 */
export function useParallaxLayer(
  target: HTMLElement | null,
  options: UseParallaxLayerOptions
): UseParallaxLayerReturn {
  const { viewportProgress } = useElementViewport(target)
  const axis = options.axis ?? 'y'
  const range = options.range ?? 100
  const speed = options.speed
  const clamp = options.clamp ?? false

  const progress = options.easing ? options.easing(viewportProgress) : viewportProgress

  const style = useMemo(() => {
    if (prefersReducedMotion()) return { transform: 'none' }
    const amplitude = range * speed
    const offset = mapRange(progress, [0, 1], [amplitude, -amplitude], clamp)
    return { transform: axis === 'y' ? `translateY(${offset}px)` : `translateX(${offset}px)` }
  }, [progress, axis, range, speed, clamp])

  return { style, progress }
}
