import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useReveal } from '../src/useReveal'
import { installIntersectionObserverMock, MockIntersectionObserver } from './mocks/intersection-observer'

describe('useReveal', () => {
  let mock: ReturnType<typeof installIntersectionObserverMock>

  beforeEach(() => {
    mock = installIntersectionObserverMock()
  })

  afterEach(() => {
    mock.restore()
  })

  it('observes the target and reports isVisible/ratio', () => {
    const el = document.createElement('div')
    const { result } = renderHook(() => useReveal(el))

    act(() => {
      MockIntersectionObserver.instances[0].trigger([{ target: el, isIntersecting: true, intersectionRatio: 0.8 }])
    })

    expect(result.current.isVisible).toBe(true)
    expect(result.current.ratio).toBe(0.8)
  })

  it('toggles the default "in" class as the target enters/leaves the viewport', () => {
    const el = document.createElement('div')
    renderHook(({ target }) => useReveal(target), { initialProps: { target: el } })

    act(() => {
      MockIntersectionObserver.instances[0].trigger([{ target: el, isIntersecting: true }])
    })
    expect(el.classList.contains('in')).toBe(true)

    act(() => {
      MockIntersectionObserver.instances[0].trigger([{ target: el, isIntersecting: false }])
    })
    expect(el.classList.contains('in')).toBe(false)
  })

  it('uses a custom activeClass and activeAttribute', () => {
    const el = document.createElement('div')
    renderHook(({ target }) => useReveal(target, { activeClass: 'visible', activeAttribute: 'data-active' }), {
      initialProps: { target: el },
    })

    act(() => {
      MockIntersectionObserver.instances[0].trigger([{ target: el, isIntersecting: true }])
    })

    expect(el.classList.contains('visible')).toBe(true)
    expect(el.classList.contains('in')).toBe(false)
    expect(el.hasAttribute('data-active')).toBe(true)
  })

  it('does not toggle a class when activeClass is null', () => {
    const el = document.createElement('div')
    renderHook(({ target }) => useReveal(target, { activeClass: null }), {
      initialProps: { target: el },
    })

    act(() => {
      MockIntersectionObserver.instances[0].trigger([{ target: el, isIntersecting: true }])
    })

    expect(el.className).toBe('')
  })

  it('stops observing after one intersection when once: true', () => {
    const el = document.createElement('div')
    const { result } = renderHook(() => useReveal(el, { once: true }))

    act(() => {
      MockIntersectionObserver.instances[0].trigger([{ target: el, isIntersecting: true }])
    })

    expect(result.current.isVisible).toBe(true)
    expect(MockIntersectionObserver.instances[0].elements.has(el)).toBe(false)
  })

  it('calls onEnter/onLeave', () => {
    const el = document.createElement('div')
    const onEnter = vi.fn()
    const onLeave = vi.fn()
    renderHook(() => useReveal(el, { once: false, onEnter, onLeave }))

    act(() => {
      MockIntersectionObserver.instances[0].trigger([
        { target: el, isIntersecting: true, boundingClientRect: { top: 500 } as DOMRectReadOnly },
      ])
    })
    expect(onEnter).toHaveBeenCalledTimes(1)

    act(() => {
      MockIntersectionObserver.instances[0].trigger([
        { target: el, isIntersecting: false, boundingClientRect: { top: -100 } as DOMRectReadOnly },
      ])
    })
    expect(onLeave).toHaveBeenCalledTimes(1)
  })

  it('returns the default snapshot for a null target', () => {
    const { result } = renderHook(() => useReveal(null))
    expect(result.current).toEqual({ isVisible: false, ratio: 0 })
  })
})
