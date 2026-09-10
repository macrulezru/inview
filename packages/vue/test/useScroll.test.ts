import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { useScroll } from '../src/useScroll'
import { installRafMock } from './mocks/raf'
import { withSetup } from './helpers/withSetup'

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

  it('reflects scroll state reactively', async () => {
    const { result, wrapper } = withSetup(() => useScroll())

    setScroll(0, 500)
    window.dispatchEvent(new Event('scroll'))
    await nextTick()

    expect(result.y.value).toBe(500)
    expect(result.direction.value).toBe('down')
    expect(result.progress.value).toBeCloseTo(0.5)

    wrapper.unmount()
  })

  it('stops updating after unmount', async () => {
    const { result, wrapper } = withSetup(() => useScroll())
    wrapper.unmount()

    setScroll(0, 999)
    window.dispatchEvent(new Event('scroll'))
    await nextTick()

    expect(result.y.value).toBe(0)
  })

  it('delegates scrollTo to the underlying engine', () => {
    const scrollToSpy = vi.fn()
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo

    const { result, wrapper } = withSetup(() => useScroll())
    result.scrollTo({ y: 300 }, { behavior: 'auto' })

    expect(scrollToSpy).toHaveBeenCalledWith({ left: undefined, top: 300, behavior: 'auto' })
    wrapper.unmount()
  })
})
