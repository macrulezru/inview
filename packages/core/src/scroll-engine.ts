import { rafLoop } from './raf-loop'
import { clamp } from './utils/clamp'
import { prefersReducedMotion } from './utils/prefersReducedMotion'
import type { ScrollDirection, ScrollEngine, ScrollEngineOptions, ScrollState, ScrollToOptions } from './types'

type ScrollTarget = Window | HTMLElement

function isWindowTarget(target: ScrollTarget): target is Window {
  return typeof window !== 'undefined' && target === window
}

function getScrollPosition(target: ScrollTarget) {
  if (isWindowTarget(target)) return { x: window.scrollX, y: window.scrollY }
  return { x: target.scrollLeft, y: target.scrollTop }
}

function getMaxScroll(target: ScrollTarget) {
  if (isWindowTarget(target)) {
    const doc = document.documentElement
    return {
      x: Math.max(doc.scrollWidth - window.innerWidth, 0),
      y: Math.max(doc.scrollHeight - window.innerHeight, 0),
    }
  }
  return {
    x: Math.max(target.scrollWidth - target.clientWidth, 0),
    y: Math.max(target.scrollHeight - target.clientHeight, 0),
  }
}

function computeProgress(target: ScrollTarget, x: number, y: number): number {
  const max = getMaxScroll(target)
  if (max.y > 0) return clamp(y / max.y, 0, 1)
  if (max.x > 0) return clamp(x / max.x, 0, 1)
  return 0
}

function createNoopEngine(): ScrollEngine {
  const state: ScrollState = { x: 0, y: 0, direction: null, progress: 0, velocity: 0, isScrolling: false }
  return {
    getState: () => state,
    subscribe: (cb) => {
      cb(state)
      return () => {}
    },
    scrollTo: () => {},
    destroy: () => {},
  }
}

/**
 * Framework-agnostic scroll engine for window or a scrollable element.
 * Batches DOM scroll events into one shared rAF loop and notifies
 * subscribers only when the derived state actually changes.
 */
export function createScrollEngine(
  target: ScrollTarget = typeof window !== 'undefined' ? window : (undefined as unknown as Window),
  options: ScrollEngineOptions = {}
): ScrollEngine {
  if (typeof window === 'undefined' || !target) return createNoopEngine()

  const idleTimeout = options.idleTimeout ?? 150
  const subscribers = new Set<(state: ScrollState) => void>()

  const initial = getScrollPosition(target)
  let state: ScrollState = {
    x: initial.x,
    y: initial.y,
    direction: null,
    progress: computeProgress(target, initial.x, initial.y),
    velocity: 0,
    isScrolling: false,
  }

  let frameLastX = initial.x
  let frameLastY = initial.y
  let idleHandle: ReturnType<typeof setTimeout> | null = null

  function notify() {
    subscribers.forEach((cb) => cb(state))
  }

  function onScroll() {
    const pos = getScrollPosition(target)
    const dx = pos.x - state.x
    const dy = pos.y - state.y

    let direction: ScrollDirection = state.direction
    if (dy > 0) direction = 'down'
    else if (dy < 0) direction = 'up'
    else if (dx > 0) direction = 'right'
    else if (dx < 0) direction = 'left'

    state = {
      ...state,
      x: pos.x,
      y: pos.y,
      direction,
      progress: computeProgress(target, pos.x, pos.y),
      isScrolling: true,
    }

    if (idleHandle !== null) clearTimeout(idleHandle)
    idleHandle = setTimeout(() => {
      idleHandle = null
      state = { ...state, isScrolling: false, velocity: 0 }
      notify()
    }, idleTimeout)

    notify()
  }

  target.addEventListener('scroll', onScroll, { passive: true })

  const removeRaf = rafLoop.add(() => {
    const velocity = Math.hypot(state.x - frameLastX, state.y - frameLastY)
    frameLastX = state.x
    frameLastY = state.y
    if (velocity !== state.velocity) {
      state = { ...state, velocity }
      notify()
    }
  })

  function scrollTo(pos: number | { x?: number; y?: number }, opts: ScrollToOptions = {}) {
    const behavior = opts.behavior ?? (prefersReducedMotion() ? 'auto' : 'smooth')
    const left = typeof pos === 'number' ? undefined : pos.x
    const top = typeof pos === 'number' ? pos : pos.y
    target.scrollTo({ left, top, behavior })
  }

  return {
    getState: () => state,
    subscribe(cb) {
      subscribers.add(cb)
      cb(state)
      return () => subscribers.delete(cb)
    },
    scrollTo,
    destroy() {
      target.removeEventListener('scroll', onScroll)
      if (idleHandle !== null) clearTimeout(idleHandle)
      removeRaf()
      subscribers.clear()
    },
  }
}
