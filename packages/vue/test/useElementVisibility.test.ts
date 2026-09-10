import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { setViewportDefaults } from '../src/config'
import { useElementVisibility } from '../src/useElementVisibility'
import { installIntersectionObserverMock, MockIntersectionObserver } from './mocks/intersection-observer'
import { withSetup } from './helpers/withSetup'

describe('useElementVisibility', () => {
  let mock: ReturnType<typeof installIntersectionObserverMock>

  beforeEach(() => {
    mock = installIntersectionObserverMock()
  })

  afterEach(() => {
    mock.restore()
    setViewportDefaults({ threshold: 0, rootMargin: '0px' })
  })

  it('updates isVisible/ratio when the observer fires', async () => {
    const el = document.createElement('div')
    const target = ref<HTMLElement | null>(el)

    const { result, wrapper } = withSetup(() => useElementVisibility(target))
    await nextTick()

    const observer = MockIntersectionObserver.instances[0]
    observer.trigger([{ target: el, isIntersecting: true, intersectionRatio: 0.8 }])

    expect(result.isVisible.value).toBe(true)
    expect(result.ratio.value).toBe(0.8)

    wrapper.unmount()
  })

  it('calls onEnter when the element starts intersecting', async () => {
    const el = document.createElement('div')
    const onEnter = vi.fn()
    const onLeave = vi.fn()

    const { wrapper } = withSetup(() => useElementVisibility(ref(el), { onEnter, onLeave }))
    await nextTick()

    const observer = MockIntersectionObserver.instances[0]
    observer.trigger([{ target: el, isIntersecting: true, boundingClientRect: { top: 500 } as DOMRectReadOnly }])

    expect(onEnter).toHaveBeenCalledTimes(1)
    expect(onLeave).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('stops observing the element on unmount', async () => {
    const el = document.createElement('div')
    const { wrapper } = withSetup(() => useElementVisibility(ref(el)))
    await nextTick()

    const observer = MockIntersectionObserver.instances[0]
    wrapper.unmount()

    expect(observer.elements.has(el)).toBe(false)
  })

  it('falls back to the module-wide viewportDefaults when no threshold/rootMargin is given', async () => {
    setViewportDefaults({ threshold: 0.5, rootMargin: '20px' })

    const el = document.createElement('div')
    const { wrapper } = withSetup(() => useElementVisibility(ref(el)))
    await nextTick()

    const observer = MockIntersectionObserver.instances[0]
    expect(observer.thresholds).toEqual([0.5])
    expect(observer.rootMargin).toBe('20px')

    wrapper.unmount()
  })
})
