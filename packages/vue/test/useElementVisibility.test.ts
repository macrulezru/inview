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
    setViewportDefaults({ threshold: 0, rootMargin: '0px', once: false })
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

  it('falls back to viewportDefaults.once when no once is given', () => {
    setViewportDefaults({ once: true })

    const el = document.createElement('div')
    const { wrapper } = withSetup(() => useElementVisibility(ref(el)))

    const observer = MockIntersectionObserver.instances[0]
    observer.trigger([{ target: el, isIntersecting: true }])
    expect(observer.elements.has(el)).toBe(false)

    wrapper.unmount()
  })

  describe('reactive options', () => {
    it('updates `once` live when passed as a ref, without re-subscribing', async () => {
      const el = document.createElement('div')
      const once = ref(false)

      const { wrapper } = withSetup(() => useElementVisibility(ref(el), { once }))
      await nextTick()

      once.value = true
      await nextTick()

      const observer = MockIntersectionObserver.instances[0]
      expect(MockIntersectionObserver.instances.length).toBe(1) // no re-subscribe happened

      observer.trigger([{ target: el, isIntersecting: true }])
      expect(observer.elements.has(el)).toBe(false) // the live-updated `once: true` took effect

      wrapper.unmount()
    })

    it('flips `once` back off live too, resuming continuous observation', async () => {
      const el = document.createElement('div')
      const once = ref(true)

      const { wrapper } = withSetup(() => useElementVisibility(ref(el), { once }))
      await nextTick()

      once.value = false
      await nextTick()

      const observer = MockIntersectionObserver.instances[0]
      observer.trigger([{ target: el, isIntersecting: true }])
      expect(observer.elements.has(el)).toBe(true)

      wrapper.unmount()
    })

    it('re-subscribes (a fresh pooled observer) when threshold changes via a ref', async () => {
      const el = document.createElement('div')
      const threshold = ref(0.2)

      const { wrapper } = withSetup(() => useElementVisibility(ref(el), { threshold }))
      await nextTick()

      expect(MockIntersectionObserver.instances[0].thresholds).toEqual([0.2])

      threshold.value = 0.8
      await nextTick()

      // a genuinely new pooled observer, keyed on the new threshold
      expect(MockIntersectionObserver.instances.length).toBe(2)
      expect(MockIntersectionObserver.instances[1].thresholds).toEqual([0.8])
      expect(MockIntersectionObserver.instances[0].elements.has(el)).toBe(false)
      expect(MockIntersectionObserver.instances[1].elements.has(el)).toBe(true)

      wrapper.unmount()
    })

    it('re-subscribes (a fresh pooled observer) when rootMargin changes via a ref', async () => {
      const el = document.createElement('div')
      const rootMargin = ref('0px')

      const { wrapper } = withSetup(() => useElementVisibility(ref(el), { rootMargin }))
      await nextTick()

      expect(MockIntersectionObserver.instances[0].rootMargin).toBe('0px')

      rootMargin.value = '20px'
      await nextTick()

      expect(MockIntersectionObserver.instances.length).toBe(2)
      expect(MockIntersectionObserver.instances[1].rootMargin).toBe('20px')
      expect(MockIntersectionObserver.instances[0].elements.has(el)).toBe(false)
      expect(MockIntersectionObserver.instances[1].elements.has(el)).toBe(true)

      wrapper.unmount()
    })

    it('keeps working unchanged when once/threshold/rootMargin are passed as plain values (not refs)', async () => {
      const el = document.createElement('div')
      const { wrapper } = withSetup(() => useElementVisibility(ref(el), { threshold: 0.3, rootMargin: '15px', once: true }))
      await nextTick()

      const observer = MockIntersectionObserver.instances[0]
      expect(observer.thresholds).toEqual([0.3])
      expect(observer.rootMargin).toBe('15px')

      observer.trigger([{ target: el, isIntersecting: true }])
      expect(observer.elements.has(el)).toBe(false)

      wrapper.unmount()
    })
  })
})
