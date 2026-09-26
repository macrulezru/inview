import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ObserverPool } from '../src/observer-pool'
import { createVisibilityEngine } from '../src/visibility-engine'
import { installIntersectionObserverMock, MockIntersectionObserver } from './mocks/intersection-observer'

describe('createVisibilityEngine', () => {
  let mock: ReturnType<typeof installIntersectionObserverMock>
  let pool: ObserverPool

  beforeEach(() => {
    mock = installIntersectionObserverMock()
    pool = new ObserverPool()
  })

  afterEach(() => {
    mock.restore()
  })

  it('reports isIntersecting and intersectionRatio', () => {
    const engine = createVisibilityEngine(pool)
    const el = document.createElement('div')
    const cb = vi.fn()

    engine.observe(el, {}, cb)
    MockIntersectionObserver.instances[0].trigger([{ target: el, isIntersecting: true, intersectionRatio: 0.75 }])

    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({ isIntersecting: true, intersectionRatio: 0.75 })
    )
  })

  it('fires onEnter/onLeave with edge direction', () => {
    const engine = createVisibilityEngine(pool)
    const el = document.createElement('div')
    const onEnter = vi.fn()
    const onLeave = vi.fn()

    engine.observe(el, { onEnter, onLeave }, () => {})
    const observer = MockIntersectionObserver.instances[0]

    observer.trigger([
      { target: el, isIntersecting: true, boundingClientRect: { top: 500 } as DOMRectReadOnly },
    ])
    expect(onEnter).toHaveBeenCalledWith(expect.objectContaining({ edge: 'enter-bottom' }))

    observer.trigger([
      { target: el, isIntersecting: false, boundingClientRect: { top: -100 } as DOMRectReadOnly },
    ])
    expect(onLeave).toHaveBeenCalledWith(expect.objectContaining({ edge: 'leave-top' }))
  })

  it('unsubscribes automatically after the first intersection when once is set', () => {
    const engine = createVisibilityEngine(pool)
    const el = document.createElement('div')
    const cb = vi.fn()

    engine.observe(el, { once: true }, cb)
    const observer = MockIntersectionObserver.instances[0]

    observer.trigger([{ target: el, isIntersecting: true }])
    expect(observer.elements.size).toBe(0)
  })

  it('destroy() tears down every active observation', () => {
    const engine = createVisibilityEngine(pool)
    const el = document.createElement('div')

    engine.observe(el, {}, () => {})
    const observer = MockIntersectionObserver.instances[0]

    engine.destroy()
    expect(observer.elements.size).toBe(0)
  })

  describe('handle.update()', () => {
    it('is still callable as a plain unsubscribe function', () => {
      const engine = createVisibilityEngine(pool)
      const el = document.createElement('div')

      const handle = engine.observe(el, {}, () => {})
      const observer = MockIntersectionObserver.instances[0]

      handle()
      expect(observer.elements.size).toBe(0)
    })

    it('swaps onEnter/onLeave live, without re-subscribing', () => {
      const engine = createVisibilityEngine(pool)
      const el = document.createElement('div')
      const firstOnEnter = vi.fn()
      const secondOnEnter = vi.fn()

      const handle = engine.observe(el, { onEnter: firstOnEnter }, () => {})
      const observer = MockIntersectionObserver.instances[0]

      handle.update({ onEnter: secondOnEnter })

      observer.trigger([{ target: el, isIntersecting: true, boundingClientRect: { top: 500 } as DOMRectReadOnly }])

      expect(firstOnEnter).not.toHaveBeenCalled()
      expect(secondOnEnter).toHaveBeenCalledTimes(1)
      // still the same pooled observer instance — no re-subscribe happened
      expect(MockIntersectionObserver.instances.length).toBe(1)
    })

    it('flips once live: an element that was continuous can start unsubscribing after one intersection', () => {
      const engine = createVisibilityEngine(pool)
      const el = document.createElement('div')

      const handle = engine.observe(el, { once: false }, () => {})
      const observer = MockIntersectionObserver.instances[0]

      handle.update({ once: true })

      observer.trigger([{ target: el, isIntersecting: true }])
      expect(observer.elements.size).toBe(0)
    })

    it('flips once live the other way: a once observation can become continuous before it first fires', () => {
      const engine = createVisibilityEngine(pool)
      const el = document.createElement('div')
      const cb = vi.fn()

      const handle = engine.observe(el, { once: true }, cb)
      const observer = MockIntersectionObserver.instances[0]

      handle.update({ once: false })

      observer.trigger([{ target: el, isIntersecting: true }])
      expect(observer.elements.size).toBe(1)

      observer.trigger([{ target: el, isIntersecting: false }])
      observer.trigger([{ target: el, isIntersecting: true }])
      expect(cb).toHaveBeenCalledTimes(3)
    })

    it('clears onEnter/onLeave to undefined when omitted from the update, rather than keeping the old one', () => {
      const engine = createVisibilityEngine(pool)
      const el = document.createElement('div')
      const onEnter = vi.fn()

      const handle = engine.observe(el, { onEnter }, () => {})
      const observer = MockIntersectionObserver.instances[0]

      handle.update({})

      observer.trigger([{ target: el, isIntersecting: true, boundingClientRect: { top: 500 } as DOMRectReadOnly }])

      expect(onEnter).not.toHaveBeenCalled()
    })
  })
})
