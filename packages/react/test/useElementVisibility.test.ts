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

  describe('reactive options', () => {
    it('updates `once` live across re-renders, without re-subscribing', () => {
      const el = document.createElement('div')
      const { rerender } = renderHook(({ once }) => useElementVisibility(el, { once }), {
        initialProps: { once: false },
      })

      rerender({ once: true })

      const observer = MockIntersectionObserver.instances[0]
      expect(MockIntersectionObserver.instances.length).toBe(1) // no re-subscribe happened

      act(() => {
        observer.trigger([{ target: el, isIntersecting: true }])
      })
      expect(observer.elements.has(el)).toBe(false) // the live-updated `once: true` took effect
    })

    it('flips `once` back off live too, resuming continuous observation', () => {
      const el = document.createElement('div')
      const { rerender } = renderHook(({ once }) => useElementVisibility(el, { once }), {
        initialProps: { once: true },
      })

      rerender({ once: false })

      const observer = MockIntersectionObserver.instances[0]
      act(() => {
        observer.trigger([{ target: el, isIntersecting: true }])
      })
      expect(observer.elements.has(el)).toBe(true)
    })

    it('picks up a new onEnter across re-renders instead of calling a stale closure', () => {
      const el = document.createElement('div')
      const firstOnEnter = vi.fn()
      const secondOnEnter = vi.fn()

      const { rerender } = renderHook(({ onEnter }) => useElementVisibility(el, { once: false, onEnter }), {
        initialProps: { onEnter: firstOnEnter },
      })

      rerender({ onEnter: secondOnEnter })

      act(() => {
        MockIntersectionObserver.instances[0].trigger([
          { target: el, isIntersecting: true, boundingClientRect: { top: 500 } as DOMRectReadOnly },
        ])
      })

      expect(firstOnEnter).not.toHaveBeenCalled()
      expect(secondOnEnter).toHaveBeenCalledTimes(1)
    })

    it('re-subscribes (a fresh pooled observer) when threshold changes', () => {
      const el = document.createElement('div')
      const { rerender } = renderHook(({ threshold }) => useElementVisibility(el, { threshold }), {
        initialProps: { threshold: 0.2 },
      })

      expect(MockIntersectionObserver.instances[0].thresholds).toEqual([0.2])

      rerender({ threshold: 0.8 })

      expect(MockIntersectionObserver.instances.length).toBe(2)
      expect(MockIntersectionObserver.instances[1].thresholds).toEqual([0.8])
      expect(MockIntersectionObserver.instances[0].elements.has(el)).toBe(false)
      expect(MockIntersectionObserver.instances[1].elements.has(el)).toBe(true)
    })

    it('does not re-subscribe when a fresh inline threshold array has the same values every render', () => {
      const el = document.createElement('div')
      const { rerender } = renderHook(() => useElementVisibility(el, { threshold: [0, 0.5] }))

      expect(MockIntersectionObserver.instances.length).toBe(1)

      rerender()
      rerender()

      expect(MockIntersectionObserver.instances.length).toBe(1)
    })

    it('re-subscribes when rootMargin changes', () => {
      const el = document.createElement('div')
      const { rerender } = renderHook(({ rootMargin }) => useElementVisibility(el, { rootMargin }), {
        initialProps: { rootMargin: '0px' },
      })

      rerender({ rootMargin: '20px' })

      expect(MockIntersectionObserver.instances.length).toBe(2)
      expect(MockIntersectionObserver.instances[1].rootMargin).toBe('20px')
    })
  })
})
