import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { scrollToElement } from '../src/utils/scrollToElement'

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

describe('scrollToElement', () => {
  let scrollToSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setMatchMedia(false)
    Object.defineProperty(window, 'scrollX', { value: 0, configurable: true })
    Object.defineProperty(window, 'scrollY', { value: 100, configurable: true })
    scrollToSpy = vi.fn()
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo
  })

  it('scrolls the window so the element lands at the top edge by default', () => {
    const el = document.createElement('div')
    setRect(el, { top: 400 })

    scrollToElement(el)

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 500, behavior: 'smooth' })
  })

  it('applies a px offset', () => {
    const el = document.createElement('div')
    setRect(el, { top: 400 })

    scrollToElement(el, { offset: 80 })

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 420, behavior: 'smooth' })
  })

  it('supports the x axis', () => {
    Object.defineProperty(window, 'scrollX', { value: 50, configurable: true })
    const el = document.createElement('div')
    setRect(el, { left: 200 })

    scrollToElement(el, { axis: 'x' })

    expect(scrollToSpy).toHaveBeenCalledWith({ left: 250, behavior: 'smooth' })
  })

  it('falls back to "auto" behavior under prefers-reduced-motion', () => {
    setMatchMedia(true)
    const el = document.createElement('div')
    setRect(el, { top: 400 })

    scrollToElement(el)

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 500, behavior: 'auto' })
  })

  it('respects an explicit behavior override even under prefers-reduced-motion', () => {
    setMatchMedia(true)
    const el = document.createElement('div')
    setRect(el, { top: 400 })

    scrollToElement(el, { behavior: 'smooth' })

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 500, behavior: 'smooth' })
  })

  it('scrolls a scrollable container instead of the window when target is given', () => {
    const container = document.createElement('div')
    setRect(container, { top: 50 })
    Object.defineProperty(container, 'scrollTop', { value: 30, configurable: true })
    container.scrollTo = scrollToSpy as unknown as typeof container.scrollTo

    const el = document.createElement('div')
    setRect(el, { top: 150 })

    scrollToElement(el, { target: container })

    // container.scrollTop(30) + (el.top(150) - container.top(50)) = 130
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 130, behavior: 'smooth' })
  })
})
