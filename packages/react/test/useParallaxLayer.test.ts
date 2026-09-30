import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useParallaxLayer } from '../src/useParallaxLayer'
import { installRafMock } from './mocks/raf'

function setRect(el: HTMLElement, rect: Partial<DOMRect>) {
  el.getBoundingClientRect = () =>
    ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {}, ...rect }) as DOMRect
}

function setMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) =>
    ({
      matches,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => true,
    }) as unknown as MediaQueryList) as typeof window.matchMedia
}

describe('useParallaxLayer', () => {
  let raf: ReturnType<typeof installRafMock>

  beforeEach(() => {
    raf = installRafMock()
    Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true })
    setMatchMedia(false)
  })

  afterEach(() => {
    raf.restore()
  })

  it('centers the offset at 0 when the element is centered in the viewport', () => {
    const el = document.createElement('div')
    setRect(el, { top: 250, height: 100 })

    const { result } = renderHook(() => useParallaxLayer(el, { speed: 1 }))

    expect(result.current.progress).toBeCloseTo(0.5, 2)
    expect(result.current.style.transform).toBe('translateY(0px)')
  })

  it('scales the offset amplitude with speed', () => {
    const el = document.createElement('div')
    setRect(el, { top: 600, height: 100 })

    const { result } = renderHook(() => useParallaxLayer(el, { speed: 2, range: 100 }))

    expect(result.current.style.transform).toBe('translateY(200px)')
  })

  it('supports the x axis', () => {
    const el = document.createElement('div')
    setRect(el, { top: 600, height: 100 })

    const { result } = renderHook(() => useParallaxLayer(el, { speed: 1, axis: 'x' }))

    expect(result.current.style.transform).toContain('translateX(')
  })

  it('applies a custom easing to progress before mapping it to an offset', () => {
    const el = document.createElement('div')
    setRect(el, { top: 250, height: 100 })

    const { result } = renderHook(() => useParallaxLayer(el, { speed: 1, easing: () => 1 }))

    expect(result.current.progress).toBe(1)
    expect(result.current.style.transform).toBe('translateY(-100px)')
  })

  it('disables the effect when prefers-reduced-motion is set', () => {
    setMatchMedia(true)
    const el = document.createElement('div')
    setRect(el, { top: 600, height: 100 })

    const { result } = renderHook(() => useParallaxLayer(el, { speed: 1 }))

    expect(result.current.style.transform).toBe('none')
  })

  it('measures progress relative to a root container when passed', () => {
    const root = document.createElement('div')
    setRect(root, { top: 100, height: 400 }) // root spans window y 100..500

    const el = document.createElement('div')
    // sits exactly at root's bottom edge (progress 0 relative to root); with
    // window.innerHeight 600 (set in beforeEach) this would NOT be 0 without root
    setRect(el, { top: 500, height: 100 })

    const { result } = renderHook(() => useParallaxLayer(el, { speed: 1, root }))

    expect(result.current.progress).toBe(0)
  })
})
