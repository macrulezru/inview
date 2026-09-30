import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createScrollSpy } from '../src/scroll-spy'
import { installIntersectionObserverMock, MockIntersectionObserver } from './mocks/intersection-observer'

describe('createScrollSpy', () => {
  let mock: ReturnType<typeof installIntersectionObserverMock>

  beforeEach(() => {
    mock = installIntersectionObserverMock()
  })

  afterEach(() => {
    mock.restore()
  })

  it('reports the index of the currently-intersecting target', () => {
    const a = document.createElement('div')
    const b = document.createElement('div')
    const onChange = vi.fn()

    const spy = createScrollSpy([a, b], undefined, onChange)
    const observer = MockIntersectionObserver.instances[0]

    observer.trigger([{ target: b, isIntersecting: true }])
    expect(onChange).toHaveBeenLastCalledWith(1)

    spy.destroy()
  })

  it('reports null when nothing is intersecting', () => {
    const a = document.createElement('div')
    const onChange = vi.fn()

    const spy = createScrollSpy([a], undefined, onChange)
    const observer = MockIntersectionObserver.instances[0]

    observer.trigger([{ target: a, isIntersecting: true }])
    observer.trigger([{ target: a, isIntersecting: false }])
    expect(onChange).toHaveBeenLastCalledWith(null)

    spy.destroy()
  })

  it('prefers the earliest target when more than one intersects at once', () => {
    const a = document.createElement('div')
    const b = document.createElement('div')
    const onChange = vi.fn()

    const spy = createScrollSpy([a, b], undefined, onChange)
    const observer = MockIntersectionObserver.instances[0]

    observer.trigger([
      { target: a, isIntersecting: true },
      { target: b, isIntersecting: true },
    ])
    expect(onChange).toHaveBeenLastCalledWith(0)

    spy.destroy()
  })

  it('skips null/undefined entries in the targets array', () => {
    const b = document.createElement('div')
    const onChange = vi.fn()

    const spy = createScrollSpy([null, b], undefined, onChange)
    const observer = MockIntersectionObserver.instances[0]

    observer.trigger([{ target: b, isIntersecting: true }])
    expect(onChange).toHaveBeenLastCalledWith(1)

    spy.destroy()
  })

  it('uses the default rootMargin (a band near the vertical center) unless overridden', () => {
    const a = document.createElement('div')
    const spy = createScrollSpy([a], undefined, () => {})

    expect(MockIntersectionObserver.instances[0].rootMargin).toBe('-45% 0px -45% 0px')

    spy.destroy()
  })

  it('honors a custom rootMargin/threshold', () => {
    const a = document.createElement('div')
    const spy = createScrollSpy([a], { rootMargin: '0px', threshold: 0.5 }, () => {})

    expect(MockIntersectionObserver.instances[0].rootMargin).toBe('0px')
    expect(MockIntersectionObserver.instances[0].thresholds).toEqual([0.5])

    spy.destroy()
  })

  it('stops observing every target on destroy', () => {
    const a = document.createElement('div')
    const b = document.createElement('div')

    const spy = createScrollSpy([a, b], undefined, () => {})
    const observer = MockIntersectionObserver.instances[0]

    spy.destroy()
    expect(observer.elements.size).toBe(0)
  })
})
