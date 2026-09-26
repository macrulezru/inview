import { computed, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue'
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
  /** measures viewportProgress relative to this scroll container instead of the window — for a parallax layer inside `overflow: auto`. default null (window) */
  root?: MaybeRefOrGetter<HTMLElement | null | undefined>
}

export interface UseParallaxLayerReturn {
  style: ComputedRef<{ transform: string }>
  progress: Ref<number>
}

/**
 * Ready-made "layer with its own scroll speed" primitive: maps the element's
 * viewportProgress into a CSS transform offset, honoring prefers-reduced-motion.
 */
export function useParallaxLayer(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UseParallaxLayerOptions
): UseParallaxLayerReturn {
  const { viewportProgress } = useElementViewport(target, { root: options.root })
  const axis = options.axis ?? 'y'
  const range = options.range ?? 100

  const progress = computed(() => {
    const raw = viewportProgress.value
    return options.easing ? options.easing(raw) : raw
  })

  const style = computed(() => {
    if (prefersReducedMotion()) return { transform: 'none' }
    const amplitude = range * options.speed
    const offset = mapRange(progress.value, [0, 1], [amplitude, -amplitude], options.clamp ?? false)
    return { transform: axis === 'y' ? `translateY(${offset}px)` : `translateX(${offset}px)` }
  })

  return { style, progress }
}
