import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createElementTracker } from '../src/element-tracker'
import type { ElementTrackerState } from '../src/types'
import { installRafMock } from './mocks/raf'

function setRect(el: HTMLElement, rect: Partial<DOMRect>) {
  el.getBoundingClientRect = () =>
    ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {}, ...rect }) as DOMRect
}

describe('createElementTracker', () => {
  let raf: ReturnType<typeof installRafMock>

  beforeEach(() => {
    raf = installRafMock()
    Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true })
  })

  afterEach(() => {
    raf.restore()
  })

  it('exposes the initial rect and viewportProgress synchronously', () => {
    const el = document.createElement('div')
    setRect(el, { top: 300, height: 100 })

    const tracker = createElementTracker(el)
    const state = tracker.getState()

    expect(state.rect.top).toBe(300)
    expect(state.viewportProgress).toBeGreaterThan(0)
    expect(state.viewportProgress).toBeLessThan(1)

    tracker.destroy()
  })

  it('recomputes on the shared rAF loop when the rect changes', () => {
    const el = document.createElement('div')
    setRect(el, { top: 600, height: 100 })

    const tracker = createElementTracker(el)
    const states: ElementTrackerState[] = []
    tracker.subscribe((s) => states.push(s))

    setRect(el, { top: 0, height: 100 })
    raf.flush()

    const last = states[states.length - 1]
    expect(last.rect.top).toBe(0)
    expect(last.viewportProgress).toBeCloseTo(600 / 700, 2)

    tracker.destroy()
  })

  it('reports distanceFromCenter relative to the viewport center', () => {
    const el = document.createElement('div')
    setRect(el, { top: 250, height: 100 })

    const tracker = createElementTracker(el)
    expect(tracker.getState().distanceFromCenter).toBe(0)

    tracker.destroy()
  })

  it('stops recomputing after destroy', () => {
    const el = document.createElement('div')
    setRect(el, { top: 300, height: 100 })

    const tracker = createElementTracker(el)
    tracker.destroy()

    setRect(el, { top: 0, height: 100 })
    raf.flush()

    expect(tracker.getState().rect.top).toBe(300)
  })
})
