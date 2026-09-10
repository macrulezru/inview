import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useScroll } from '../src/useScroll'
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

describe('useScroll', () => {
  let raf: ReturnType<typeof installRafMock>

  beforeEach(() => {
    raf = installRafMock()
    setScroll(0, 0)
    setMaxScroll(0, 1000)
  })

  afterEach(() => {
    raf.restore()
  })

  it('reflects scroll state reactively', () => {
    const { result } = renderHook(() => useScroll())

    act(() => {
      setScroll(0, 500)
      window.dispatchEvent(new Event('scroll'))
    })

    expect(result.current.y).toBe(500)
    expect(result.current.direction).toBe('down')
    expect(result.current.progress).toBeCloseTo(0.5)
  })

  it('stops updating after unmount', () => {
    const { result, unmount } = renderHook(() => useScroll())
    unmount()

    act(() => {
      setScroll(0, 999)
      window.dispatchEvent(new Event('scroll'))
    })

    expect(result.current.y).toBe(0)
  })

  it('delegates scrollTo to the underlying engine', () => {
    const scrollToSpy = vi.fn()
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo

    const { result } = renderHook(() => useScroll())
    act(() => {
      result.current.scrollTo({ y: 300 }, { behavior: 'auto' })
    })

    expect(scrollToSpy).toHaveBeenCalledWith({ left: undefined, top: 300, behavior: 'auto' })
  })
})
