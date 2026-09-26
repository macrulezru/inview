import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { usePrefersReducedMotion } from '../src/usePrefersReducedMotion'
import { installMatchMediaMock } from './mocks/match-media'

const QUERY = '(prefers-reduced-motion: reduce)'

describe('usePrefersReducedMotion', () => {
  let matchMedia: ReturnType<typeof installMatchMediaMock>

  afterEach(() => {
    matchMedia.restore()
  })

  it('reflects the initial OS setting', () => {
    matchMedia = installMatchMediaMock(true)
    const { result } = renderHook(() => usePrefersReducedMotion())

    expect(result.current).toBe(true)
  })

  it('defaults to false when reduced motion is not requested', () => {
    matchMedia = installMatchMediaMock(false)
    const { result } = renderHook(() => usePrefersReducedMotion())

    expect(result.current).toBe(false)
  })

  it('updates reactively when the OS setting changes mid-session', () => {
    matchMedia = installMatchMediaMock(false)
    const { result } = renderHook(() => usePrefersReducedMotion())

    expect(result.current).toBe(false)

    act(() => {
      matchMedia.get(QUERY)?.trigger(true)
    })

    expect(result.current).toBe(true)
  })

  it('stops listening after unmount', () => {
    matchMedia = installMatchMediaMock(false)
    const { result, unmount } = renderHook(() => usePrefersReducedMotion())

    unmount()
    matchMedia.get(QUERY)?.trigger(true)

    expect(result.current).toBe(false)
  })
})
