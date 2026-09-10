import { afterEach, describe, expect, it } from 'vitest'
import { setViewportDefaults, viewportDefaults } from '../src/config'

describe('viewportDefaults', () => {
  afterEach(() => {
    setViewportDefaults({ threshold: 0, rootMargin: '0px' })
  })

  it('starts with threshold 0 and rootMargin 0px', () => {
    expect(viewportDefaults.threshold).toBe(0)
    expect(viewportDefaults.rootMargin).toBe('0px')
  })

  it('setViewportDefaults overrides only the provided keys', () => {
    setViewportDefaults({ threshold: 0.5 })
    expect(viewportDefaults.threshold).toBe(0.5)
    expect(viewportDefaults.rootMargin).toBe('0px')

    setViewportDefaults({ rootMargin: '10px' })
    expect(viewportDefaults.threshold).toBe(0.5)
    expect(viewportDefaults.rootMargin).toBe('10px')
  })
})
