import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { InView } from '../src/InView'
import { installIntersectionObserverMock, MockIntersectionObserver } from './mocks/intersection-observer'

describe('InView', () => {
  let mock: ReturnType<typeof installIntersectionObserverMock>
  let wrapper: VueWrapper | undefined

  beforeEach(() => {
    mock = installIntersectionObserverMock()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    mock.restore()
  })

  it('renders a wrapping div by default', () => {
    wrapper = mount(InView)
    expect(wrapper.element.tagName).toBe('DIV')
  })

  it('renders a custom tag via the "as" prop', () => {
    wrapper = mount(InView, { props: { as: 'section' } })
    expect(wrapper.element.tagName).toBe('SECTION')
  })

  it('exposes isVisible/ratio via the default slot and updates reactively', async () => {
    let latest: { isVisible: boolean; ratio: number } | undefined
    wrapper = mount(InView, {
      slots: {
        default: (props: { isVisible: boolean; ratio: number }) => {
          latest = props
          return h('span', String(props.isVisible))
        },
      },
    })
    // useElementVisibility watches the template ref with the default
    // (deferred) flush timing — the observer isn't actually created until
    // that watcher runs, one tick after the ref is bound during mount.
    await nextTick()

    expect(latest).toEqual({ isVisible: false, ratio: 0 })

    const observer = MockIntersectionObserver.instances[0]
    observer.trigger([{ target: wrapper.element, isIntersecting: true, intersectionRatio: 0.9 }])
    await nextTick()

    expect(latest).toEqual({ isVisible: true, ratio: 0.9 })
  })

  it('emits enter/leave events', async () => {
    wrapper = mount(InView, { props: { once: false } })
    await nextTick()
    const observer = MockIntersectionObserver.instances[0]

    observer.trigger([
      { target: wrapper.element, isIntersecting: true, boundingClientRect: { top: 500 } as DOMRectReadOnly },
    ])
    expect(wrapper.emitted('enter')).toHaveLength(1)

    observer.trigger([
      { target: wrapper.element, isIntersecting: false, boundingClientRect: { top: -100 } as DOMRectReadOnly },
    ])
    expect(wrapper.emitted('leave')).toHaveLength(1)
  })

  it('passes threshold/rootMargin through to the observer', async () => {
    wrapper = mount(InView, { props: { threshold: 0.6, rootMargin: '15px' } })
    await nextTick()
    const observer = MockIntersectionObserver.instances[0]
    expect(observer.thresholds).toEqual([0.6])
    expect(observer.rootMargin).toBe('15px')
  })

  it('stops observing after the first intersection when once is true', async () => {
    wrapper = mount(InView, { props: { once: true } })
    await nextTick()
    const observer = MockIntersectionObserver.instances[0]
    observer.trigger([{ target: wrapper.element, isIntersecting: true }])
    expect(observer.elements.has(wrapper.element)).toBe(false)
  })
})
