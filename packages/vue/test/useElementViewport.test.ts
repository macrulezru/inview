import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useElementViewport } from '../src/useElementViewport'
import { installRafMock } from './mocks/raf'
import { withSetup } from './helpers/withSetup'

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

  it('exposes the initial rect and viewportProgress', async () => {
    const el = document.createElement('div')
    setRect(el, { top: 300, height: 100 })

    const { result, wrapper } = withSetup(() => useElementViewport(ref(el)))
    await nextTick()

    expect(result.rect.value.top).toBe(300)
    expect(result.viewportProgress.value).toBeGreaterThan(0)

    wrapper.unmount()
  })

  it('recomputes on the shared rAF loop', async () => {
    const el = document.createElement('div')
    setRect(el, { top: 600, height: 100 })

    const { result, wrapper } = withSetup(() => useElementViewport(ref(el)))
    await nextTick()

    setRect(el, { top: 0, height: 100 })
    raf.flush()

    expect(result.rect.value.top).toBe(0)

    wrapper.unmount()
  })

  it('stops recomputing after unmount', async () => {
    const el = document.createElement('div')
    setRect(el, { top: 300, height: 100 })

    const { result, wrapper } = withSetup(() => useElementViewport(ref(el)))
    await nextTick()
    wrapper.unmount()

    setRect(el, { top: 0, height: 100 })
    raf.flush()

    expect(result.rect.value.top).toBe(300)
  })

  it('measures viewportProgress relative to a root container instead of the window', async () => {
    const root = document.createElement('div')
    setRect(root, { top: 100, height: 400 })

    const el = document.createElement('div')
    setRect(el, { top: 500, height: 100 }) // sits exactly at root's bottom edge

    const { result, wrapper } = withSetup(() => useElementViewport(ref(el), { root: ref(root) }))
    await nextTick()

    expect(result.viewportProgress.value).toBe(0)

    wrapper.unmount()
  })

  it('keeps rect window-relative regardless of root', async () => {
    const root = document.createElement('div')
    setRect(root, { top: 100, height: 400 })

    const el = document.createElement('div')
    setRect(el, { top: 250, height: 100 })

    const { result, wrapper } = withSetup(() => useElementViewport(ref(el), { root: ref(root) }))
    await nextTick()

    expect(result.rect.value.top).toBe(250)

    wrapper.unmount()
  })
})
