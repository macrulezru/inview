import { createElement } from 'react'
import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InView } from '../src/InView'
import { installIntersectionObserverMock, MockIntersectionObserver } from './mocks/intersection-observer'

describe('InView', () => {
  let mock: ReturnType<typeof installIntersectionObserverMock>

  beforeEach(() => {
    mock = installIntersectionObserverMock()
  })

  afterEach(() => {
    mock.restore()
  })

  it('renders a wrapping div by default', () => {
    const { container } = render(createElement(InView, null, () => null))
    expect(container.firstElementChild?.tagName).toBe('DIV')
  })

  it('renders a custom tag via the "as" prop', () => {
    const { container } = render(createElement(InView, { as: 'section' }, () => null))
    expect(container.firstElementChild?.tagName).toBe('SECTION')
  })

  it('exposes isVisible/ratio via the render-prop and updates reactively', () => {
    let latest: { isVisible: boolean; ratio: number } | undefined
    const { container } = render(
      createElement(InView, null, (state: { isVisible: boolean; ratio: number }) => {
        latest = state
        return String(state.isVisible)
      })
    )

    expect(latest).toEqual({ isVisible: false, ratio: 0 })

    const el = container.firstElementChild as HTMLElement
    const observer = MockIntersectionObserver.instances[0]
    act(() => {
      observer.trigger([{ target: el, isIntersecting: true, intersectionRatio: 0.9 }])
    })

    expect(latest).toEqual({ isVisible: true, ratio: 0.9 })
  })

  it('calls onEnter/onLeave', () => {
    const onEnter = vi.fn()
    const onLeave = vi.fn()
    const { container } = render(createElement(InView, { once: false, onEnter, onLeave }, () => null))
    const el = container.firstElementChild as HTMLElement
    const observer = MockIntersectionObserver.instances[0]

    act(() => {
      observer.trigger([{ target: el, isIntersecting: true, boundingClientRect: { top: 500 } as DOMRectReadOnly }])
    })
    expect(onEnter).toHaveBeenCalledTimes(1)

    act(() => {
      observer.trigger([{ target: el, isIntersecting: false, boundingClientRect: { top: -100 } as DOMRectReadOnly }])
    })
    expect(onLeave).toHaveBeenCalledTimes(1)
  })

  it('passes threshold/rootMargin through to the observer', () => {
    render(createElement(InView, { threshold: 0.6, rootMargin: '15px' }, () => null))
    const observer = MockIntersectionObserver.instances[0]
    expect(observer.thresholds).toEqual([0.6])
    expect(observer.rootMargin).toBe('15px')
  })

  it('stops observing after the first intersection when once is true', () => {
    const { container } = render(createElement(InView, { once: true }, () => null))
    const el = container.firstElementChild as HTMLElement
    const observer = MockIntersectionObserver.instances[0]

    act(() => {
      observer.trigger([{ target: el, isIntersecting: true }])
    })
    expect(observer.elements.has(el)).toBe(false)
  })
})
