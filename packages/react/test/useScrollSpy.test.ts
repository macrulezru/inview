import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useScrollSpy } from '../src/useScrollSpy'
import { installIntersectionObserverMock, MockIntersectionObserver } from './mocks/intersection-observer'

describe('useScrollSpy', () => {
  let mock: ReturnType<typeof installIntersectionObserverMock>

  beforeEach(() => {
    mock = installIntersectionObserverMock()
  })

  afterEach(() => {
    mock.restore()
  })

  it('reports the active index as sections intersect', () => {
    const a = document.createElement('div')
    const b = document.createElement('div')
    const targets = [a, b]

    const { result } = renderHook(() => useScrollSpy(targets))

    expect(result.current).toBe(null)

    act(() => {
      MockIntersectionObserver.instances[0].trigger([{ target: b, isIntersecting: true }])
    })

    expect(result.current).toBe(1)
  })

  it('stops observing on unmount', () => {
    const a = document.createElement('div')
    const targets = [a]

    const { unmount } = renderHook(() => useScrollSpy(targets))
    const observer = MockIntersectionObserver.instances[0]

    unmount()

    expect(observer.elements.size).toBe(0)
  })

  it('does nothing when the targets array is empty', () => {
    const { result } = renderHook(() => useScrollSpy([]))

    expect(result.current).toBe(null)
    expect(MockIntersectionObserver.instances.length).toBe(0)
  })
})
