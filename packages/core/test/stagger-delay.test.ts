import { describe, expect, it } from 'vitest'
import { staggerDelay } from '../src/utils/staggerDelay'

describe('staggerDelay', () => {
  it('multiplies index by step (default 60ms)', () => {
    expect(staggerDelay(0)).toBe('0ms')
    expect(staggerDelay(1)).toBe('60ms')
    expect(staggerDelay(3)).toBe('180ms')
  })

  it('respects a custom step', () => {
    expect(staggerDelay(2, { step: 100 })).toBe('200ms')
  })

  it('caps the effective index at max', () => {
    expect(staggerDelay(10, { step: 70, max: 3 })).toBe('210ms')
    expect(staggerDelay(2, { step: 70, max: 3 })).toBe('140ms')
  })

  it('clamps a negative index to 0', () => {
    expect(staggerDelay(-5, { step: 70 })).toBe('0ms')
  })

  it('returns seconds when unit is "s"', () => {
    expect(staggerDelay(2, { step: 500, unit: 's' })).toBe('1s')
  })
})
