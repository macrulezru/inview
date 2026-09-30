import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useScrollTo } from '../src/useScrollTo'
import { withSetup } from './helpers/withSetup'

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

describe('useScrollTo', () => {
  let scrollToSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setMatchMedia(false)
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    scrollToSpy = vi.fn()
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('scrolls the window to the given element by default', () => {
    const { result, wrapper } = withSetup(() => useScrollTo())
    const el = document.createElement('div')
    setRect(el, { top: 300 })

    result(el)

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 300, behavior: 'smooth' })
    wrapper.unmount()
  })

  it('applies an offset', () => {
    const { result, wrapper } = withSetup(() => useScrollTo())
    const el = document.createElement('div')
    setRect(el, { top: 300 })

    result(el, { offset: 80 })

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 220, behavior: 'smooth' })
    wrapper.unmount()
  })

  it('is a no-op for a null element', () => {
    const { result, wrapper } = withSetup(() => useScrollTo())
    result(null)
    expect(scrollToSpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('scrolls a container passed as a ref', () => {
    const container = document.createElement('div')
    setRect(container, { top: 50 })
    Object.defineProperty(container, 'scrollTop', { value: 0, configurable: true })
    container.scrollTo = scrollToSpy as unknown as typeof container.scrollTo

    const { result, wrapper } = withSetup(() => useScrollTo(ref(container)))
    const el = document.createElement('div')
    setRect(el, { top: 150 })

    result(el)

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 100, behavior: 'smooth' })
    wrapper.unmount()
  })
})
