import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, withDirectives } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { vReveal, type RevealDirectiveOptions } from '../src/vReveal'
import { setViewportDefaults } from '../src/config'
import { installIntersectionObserverMock, MockIntersectionObserver } from './mocks/intersection-observer'

function mountWithReveal(value?: RevealDirectiveOptions, modifiers: Record<string, boolean> = {}) {
  const Comp = defineComponent({
    render() {
      return withDirectives(h('div'), [[vReveal, value, undefined, modifiers]])
    },
  })
  return mount(Comp)
}

describe('vReveal', () => {
  let mock: ReturnType<typeof installIntersectionObserverMock>
  let wrapper: VueWrapper | undefined

  beforeEach(() => {
    mock = installIntersectionObserverMock()
  })

  afterEach(() => {
    // Pooled observers only tear down (and free their key for a fresh mock
    // instance next test) once the last subscriber unmounts — same as any
    // real page unmounting a component.
    wrapper?.unmount()
    wrapper = undefined
    mock.restore()
    setViewportDefaults({ threshold: 0, rootMargin: '0px', once: false })
  })

  it('observes the bound element on mount', () => {
    wrapper = mountWithReveal()
    expect(MockIntersectionObserver.instances[0].elements.has(wrapper.element)).toBe(true)
  })

  it('toggles the default "in" class on intersect', () => {
    wrapper = mountWithReveal()
    MockIntersectionObserver.instances[0].trigger([{ target: wrapper.element, isIntersecting: true }])
    expect(wrapper.element.classList.contains('in')).toBe(true)
  })

  it('defaults to once: false, unlike createRevealController', () => {
    wrapper = mountWithReveal()
    const observer = MockIntersectionObserver.instances[0]
    observer.trigger([{ target: wrapper.element, isIntersecting: true }])
    expect(observer.elements.has(wrapper.element)).toBe(true)
  })

  it('stops observing after one intersection when once: true is passed', () => {
    wrapper = mountWithReveal({ once: true })
    const observer = MockIntersectionObserver.instances[0]
    observer.trigger([{ target: wrapper.element, isIntersecting: true }])
    expect(observer.elements.has(wrapper.element)).toBe(false)
  })

  it('supports the .once modifier as shorthand', () => {
    wrapper = mountWithReveal(undefined, { once: true })
    const observer = MockIntersectionObserver.instances[0]
    observer.trigger([{ target: wrapper.element, isIntersecting: true }])
    expect(observer.elements.has(wrapper.element)).toBe(false)
  })

  it('uses a custom class and attribute', () => {
    wrapper = mountWithReveal({ class: 'visible', attribute: 'data-active', once: false })
    const observer = MockIntersectionObserver.instances[0]
    observer.trigger([{ target: wrapper.element, isIntersecting: true }])
    expect(wrapper.element.classList.contains('visible')).toBe(true)
    expect(wrapper.element.hasAttribute('data-active')).toBe(true)
  })

  it('falls back to viewportDefaults when no options are given', () => {
    setViewportDefaults({ threshold: 0.4, rootMargin: '5px', once: true })
    wrapper = mountWithReveal()
    const observer = MockIntersectionObserver.instances[0]
    expect(observer.thresholds).toEqual([0.4])
    expect(observer.rootMargin).toBe('5px')
  })

  it('unobserves on unmount', () => {
    wrapper = mountWithReveal()
    const observer = MockIntersectionObserver.instances[0]
    wrapper.unmount()
    wrapper = undefined
    expect(observer.elements.size).toBe(0)
  })

  it('calls onEnter/onLeave', () => {
    const onEnter = vi.fn()
    const onLeave = vi.fn()
    wrapper = mountWithReveal({ once: false, onEnter, onLeave })
    const observer = MockIntersectionObserver.instances[0]

    observer.trigger([
      { target: wrapper.element, isIntersecting: true, boundingClientRect: { top: 500 } as DOMRectReadOnly },
    ])
    expect(onEnter).toHaveBeenCalledTimes(1)

    observer.trigger([
      { target: wrapper.element, isIntersecting: false, boundingClientRect: { top: -100 } as DOMRectReadOnly },
    ])
    expect(onLeave).toHaveBeenCalledTimes(1)
  })
})
