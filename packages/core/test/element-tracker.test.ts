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

  describe('with a root container', () => {
    it('measures viewportProgress relative to root instead of the window', () => {
      const root = document.createElement('div')
      setRect(root, { top: 100, height: 400 }) // root spans window y 100..500

      const el = document.createElement('div')
      // sits exactly at root's bottom edge — "just entering" relative to root
      setRect(el, { top: 500, height: 100 })

      const withRoot = createElementTracker(el, { root })
      expect(withRoot.getState().viewportProgress).toBe(0)
      withRoot.destroy()

      // the same element, same window.innerHeight (600, set in beforeEach),
      // reports a different (non-zero) progress without root — proving root
      // actually changes which frame the progress is measured against
      const withoutRoot = createElementTracker(el)
      expect(withoutRoot.getState().viewportProgress).toBeCloseTo(100 / 700, 5)
      withoutRoot.destroy()
    })

    it('centers distanceFromCenter on root, not the window', () => {
      const root = document.createElement('div')
      setRect(root, { top: 100, height: 400 })
      // root's own center in window coordinates: 100 + 400/2 = 300

      const el = document.createElement('div')
      setRect(el, { top: 250, height: 100 })
      // el's center in window coordinates: 250 + 100/2 = 300 — matches root's center

      const tracker = createElementTracker(el, { root })
      expect(tracker.getState().distanceFromCenter).toBe(0)

      tracker.destroy()
    })

    it('keeps rect window-relative regardless of root', () => {
      const root = document.createElement('div')
      setRect(root, { top: 100, height: 400 })

      const el = document.createElement('div')
      setRect(el, { top: 250, height: 100 })

      const tracker = createElementTracker(el, { root })
      expect(tracker.getState().rect.top).toBe(250)

      tracker.destroy()
    })

    it('matches the window-relative result when root is null', () => {
      const el = document.createElement('div')
      setRect(el, { top: 250, height: 100 })

      const withRoot = createElementTracker(el, { root: null })
      const withoutRoot = createElementTracker(el)

      expect(withRoot.getState()).toEqual(withoutRoot.getState())

      withRoot.destroy()
      withoutRoot.destroy()
    })

    it('recomputes on the rAF loop as root itself moves', () => {
      const root = document.createElement('div')
      setRect(root, { top: 100, height: 400 })

      const el = document.createElement('div')
      setRect(el, { top: 250, height: 100 })

      const tracker = createElementTracker(el, { root })
      expect(tracker.getState().distanceFromCenter).toBe(0)

      setRect(root, { top: 0, height: 400 })
      raf.flush()

      // root moved up 100px without el moving — el is now 100px below root's center
      expect(tracker.getState().distanceFromCenter).toBe(100)

      tracker.destroy()
    })
  })
})
