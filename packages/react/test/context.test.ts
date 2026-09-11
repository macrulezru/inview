import { createElement } from 'react'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useElementVisibility } from '../src/useElementVisibility'
import { InviewProvider, useInviewDefaults } from '../src/context'
import { installIntersectionObserverMock, MockIntersectionObserver } from './mocks/intersection-observer'

describe('useInviewDefaults', () => {
  it('returns the package-wide defaults outside a provider', () => {
    const { result } = renderHook(() => useInviewDefaults())
    expect(result.current).toEqual({ threshold: 0, rootMargin: '0px', once: false })
  })

  it('returns the merged defaults inside a provider', () => {
    const { result } = renderHook(() => useInviewDefaults(), {
      wrapper: ({ children }) =>
        createElement(InviewProvider, { defaults: { threshold: 0.5, once: true } }, children),
    })
    expect(result.current).toEqual({ threshold: 0.5, rootMargin: '0px', once: true })
  })
})

describe('useElementVisibility + InviewProvider', () => {
  let mock: ReturnType<typeof installIntersectionObserverMock>

  beforeEach(() => {
    mock = installIntersectionObserverMock()
  })

  afterEach(() => {
    mock.restore()
  })

  it('uses provider defaults when no explicit options are passed', () => {
    const el = document.createElement('div')
    renderHook(() => useElementVisibility(el), {
      wrapper: ({ children }) =>
        createElement(InviewProvider, { defaults: { threshold: 0.4, rootMargin: '5px', once: true } }, children),
    })

    const observer = MockIntersectionObserver.instances[0]
    expect(observer.thresholds).toEqual([0.4])
    expect(observer.rootMargin).toBe('5px')
  })

  it('lets explicit options win over provider defaults', () => {
    const el = document.createElement('div')
    renderHook(() => useElementVisibility(el, { threshold: 0.9 }), {
      wrapper: ({ children }) =>
        createElement(InviewProvider, { defaults: { threshold: 0.4, once: true } }, children),
    })

    const observer = MockIntersectionObserver.instances[0]
    expect(observer.thresholds).toEqual([0.9])
  })

  it('stops observing once: true elements from the provider default after one intersection', () => {
    const el = document.createElement('div')
    renderHook(() => useElementVisibility(el), {
      wrapper: ({ children }) => createElement(InviewProvider, { defaults: { once: true } }, children),
    })

    const observer = MockIntersectionObserver.instances[0]
    act(() => {
      observer.trigger([{ target: el, isIntersecting: true }])
    })
    expect(observer.elements.has(el)).toBe(false)
  })
})
