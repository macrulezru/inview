import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useElementViewport } from '../src/useElementViewport'
import { installRafMock } from './mocks/raf'

function setRect(el: HTMLElement, rect: Partial<DOMRect>) {
  el.getBoundingClientRect = () =>
    ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {}, ...rect }) as DOMRect
}

describe('useElementViewport', () => {
  let raf: ReturnType<typeof installRafMock>

  beforeEach(() => {
    raf = installRafMock()
    Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true })
  })

  afterEach(() => {
    raf.restore()
  })

  it('exposes the initial rect and viewportProgress', () => {
    const el = document.createElement('div')
    setRect(el, { top: 300, height: 100 })

    const { result } = renderHook(() => useElementViewport(el))

    expect(result.current.rect.top).toBe(300)
    expect(result.current.viewportProgress).toBeGreaterThan(0)
  })

  it('recomputes on the shared rAF loop', () => {
    const el = document.createElement('div')
    setRect(el, { top: 600, height: 100 })

    const { result } = renderHook(() => useElementViewport(el))

    act(() => {
      setRect(el, { top: 0, height: 100 })
      raf.flush()
    })

    expect(result.current.rect.top).toBe(0)
  })

  it('stops recomputing after unmount', () => {
    const el = document.createElement('div')
    setRect(el, { top: 300, height: 100 })

    const { result, unmount } = renderHook(() => useElementViewport(el))
    unmount()

    act(() => {
      setRect(el, { top: 0, height: 100 })
      raf.flush()
    })

    expect(result.current.rect.top).toBe(300)
  })
})
