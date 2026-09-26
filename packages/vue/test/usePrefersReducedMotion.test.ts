import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { usePrefersReducedMotion } from '../src/usePrefersReducedMotion'
import { installMatchMediaMock } from './mocks/match-media'
import { withSetup } from './helpers/withSetup'

const QUERY = '(prefers-reduced-motion: reduce)'

describe('usePrefersReducedMotion', () => {
  let matchMedia: ReturnType<typeof installMatchMediaMock>

  afterEach(() => {
    matchMedia.restore()
  })

  it('reflects the initial OS setting', () => {
    matchMedia = installMatchMediaMock(true)
    const { result, wrapper } = withSetup(() => usePrefersReducedMotion())

    expect(result.value).toBe(true)

    wrapper.unmount()
  })

  it('defaults to false when reduced motion is not requested', () => {
    matchMedia = installMatchMediaMock(false)
    const { result, wrapper } = withSetup(() => usePrefersReducedMotion())

    expect(result.value).toBe(false)

    wrapper.unmount()
  })

  it('updates reactively when the OS setting changes mid-session', () => {
    matchMedia = installMatchMediaMock(false)
    const { result, wrapper } = withSetup(() => usePrefersReducedMotion())

    expect(result.value).toBe(false)

    matchMedia.get(QUERY)?.trigger(true)

    expect(result.value).toBe(true)

    wrapper.unmount()
  })

  it('stops listening after unmount', () => {
    matchMedia = installMatchMediaMock(false)
    const { result, wrapper } = withSetup(() => usePrefersReducedMotion())

    wrapper.unmount()
    matchMedia.get(QUERY)?.trigger(true)

    expect(result.value).toBe(false)
  })
})
