import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useElementVisibility } from '../src/useElementVisibility'
import { installIntersectionObserverMock, MockIntersectionObserver } from './mocks/intersection-observer'

describe('useElementVisibility', () => {
  let mock: ReturnType<typeof installIntersectionObserverMock>

  beforeEach(() => {
    mock = installIntersectionObserverMock()
  })

  afterEach(() => {
    mock.restore()
  })

  it('updates isVisible/ratio when the observer fires', () => {
    const el = document.createElement('div')
    const { result } = renderHook(() => useElementVisibility(el))

    act(() => {
      MockIntersectionObserver.instances[0].trigger([{ target: el, isIntersecting: true, intersectionRatio: 0.8 }])
    })

    expect(result.current.isVisible).toBe(true)
    expect(result.current.ratio).toBe(0.8)
  })

  it('calls onEnter when the element starts intersecting', () => {
    const el = document.createElement('div')
    const onEnter = vi.fn()
    const onLeave = vi.fn()

    renderHook(() => useElementVisibility(el, { onEnter, onLeave }))

    act(() => {
      MockIntersectionObserver.instances[0].trigger([
        { target: el, isIntersecting: true, boundingClientRect: { top: 500 } as DOMRectReadOnly },
      ])
    })

    expect(onEnter).toHaveBeenCalledTimes(1)
    expect(onLeave).not.toHaveBeenCalled()
  })

  it('stops observing the element on unmount', () => {
    const el = document.createElement('div')
    const { unmount } = renderHook(() => useElementVisibility(el))

    const observer = MockIntersectionObserver.instances[0]
    unmount()

    expect(observer.elements.has(el)).toBe(false)
  })

  it('returns the default snapshot for a null target', () => {
    const { result } = renderHook(() => useElementVisibility(null))
    expect(result.current).toEqual({ isVisible: false, ratio: 0 })
  })
})
