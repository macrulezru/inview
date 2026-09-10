import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useParallaxLayer } from '../src/useParallaxLayer'
import { installRafMock } from './mocks/raf'
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

  it('centers the offset at 0 when the element is centered in the viewport (progress 0.5)', async () => {
    const el = document.createElement('div')
    // top=250, height=100 -> center at 300 == viewport center (600/2) -> progress 0.5
    setRect(el, { top: 250, height: 100 })

    const { result, wrapper } = withSetup(() => useParallaxLayer(ref(el), { speed: 1 }))
    await nextTick()

    expect(result.progress.value).toBeCloseTo(0.5, 2)
    expect(result.style.value.transform).toBe('translateY(0px)')

    wrapper.unmount()
  })

  it('scales the offset amplitude with speed', async () => {
    const el = document.createElement('div')
    setRect(el, { top: 600, height: 100 }) // just entering at the bottom -> progress ~0

    const { result, wrapper } = withSetup(() => useParallaxLayer(ref(el), { speed: 2, range: 100 }))
    await nextTick()

    expect(result.style.value.transform).toBe('translateY(200px)')

    wrapper.unmount()
  })

  it('supports the x axis', async () => {
    const el = document.createElement('div')
    setRect(el, { top: 600, height: 100 })

    const { result, wrapper } = withSetup(() => useParallaxLayer(ref(el), { speed: 1, axis: 'x' }))
    await nextTick()

    expect(result.style.value.transform).toContain('translateX(')

    wrapper.unmount()
  })

  it('applies a custom easing to progress before mapping it to an offset', async () => {
    const el = document.createElement('div')
    setRect(el, { top: 250, height: 100 }) // raw progress 0.5

    const { result, wrapper } = withSetup(() =>
      useParallaxLayer(ref(el), { speed: 1, easing: () => 1 })
    )
    await nextTick()

    expect(result.progress.value).toBe(1)
    expect(result.style.value.transform).toBe('translateY(-100px)')

    wrapper.unmount()
  })

  it('disables the effect when prefers-reduced-motion is set', async () => {
    setMatchMedia(true)
    const el = document.createElement('div')
    setRect(el, { top: 600, height: 100 })

    const { result, wrapper } = withSetup(() => useParallaxLayer(ref(el), { speed: 1 }))
    await nextTick()

    expect(result.style.value.transform).toBe('none')

    wrapper.unmount()
  })
})
