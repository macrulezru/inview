import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createScrollEngine } from '../src/scroll-engine'
import type { ScrollState } from '../src/types'
import { installRafMock } from './mocks/raf'

function setScroll(x: number, y: number) {
  Object.defineProperty(window, 'scrollX', { value: x, configurable: true })
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
}

function setMaxScroll(extraWidth: number, extraHeight: number) {
  Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true })
  Object.defineProperty(document.documentElement, 'scrollWidth', { value: 800 + extraWidth, configurable: true })
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: 600 + extraHeight, configurable: true })
}

describe('createScrollEngine', () => {
  let raf: ReturnType<typeof installRafMock>

  beforeEach(() => {
    raf = installRafMock()
    vi.useFakeTimers()
    setScroll(0, 0)
    setMaxScroll(0, 1000)
  })

  afterEach(() => {
    raf.restore()
    vi.useRealTimers()
  })

  it('reports x/y/direction/progress on scroll', () => {
    const engine = createScrollEngine(window)
    const states: ScrollState[] = []
    engine.subscribe((s) => states.push(s))

    setScroll(0, 500)
    window.dispatchEvent(new Event('scroll'))

    const last = states[states.length - 1]
    expect(last.y).toBe(500)
    expect(last.direction).toBe('down')
    expect(last.progress).toBeCloseTo(0.5)
    expect(last.isScrolling).toBe(true)

    engine.destroy()
  })

  it('flips isScrolling back to false after idleTimeout', () => {
    const engine = createScrollEngine(window, { idleTimeout: 100 })
    const states: ScrollState[] = []
    engine.subscribe((s) => states.push(s))

    setScroll(0, 100)
    window.dispatchEvent(new Event('scroll'))
    expect(states[states.length - 1].isScrolling).toBe(true)

    vi.advanceTimersByTime(100)
    expect(states[states.length - 1].isScrolling).toBe(false)
    expect(states[states.length - 1].velocity).toBe(0)

    engine.destroy()
  })

  it('computes velocity via the shared rAF loop', () => {
    const engine = createScrollEngine(window)
    const states: ScrollState[] = []
    engine.subscribe((s) => states.push(s))

    setScroll(0, 300)
    window.dispatchEvent(new Event('scroll'))
    raf.flush()

    expect(states.some((s) => s.velocity > 0)).toBe(true)

    engine.destroy()
  })

  it('stops notifying subscribers after destroy', () => {
    const engine = createScrollEngine(window)
    const cb = vi.fn()
    engine.subscribe(cb)
    cb.mockClear()
    engine.destroy()

    setScroll(0, 200)
    window.dispatchEvent(new Event('scroll'))
    expect(cb).not.toHaveBeenCalled()
  })

  it('delegates scrollTo to the target', () => {
    const scrollToSpy = vi.fn()
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo

    const engine = createScrollEngine(window)
    engine.scrollTo({ x: 10, y: 20 }, { behavior: 'auto' })

    expect(scrollToSpy).toHaveBeenCalledWith({ left: 10, top: 20, behavior: 'auto' })
    engine.destroy()
  })
})
