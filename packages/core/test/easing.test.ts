import { describe, expect, it } from 'vitest'
import { easings } from '../src/easing'

describe('easings', () => {
  it('every preset maps 0 to 0 and 1 to 1', () => {
    for (const [name, fn] of Object.entries(easings)) {
      expect(fn(0), name).toBeCloseTo(0, 5)
      expect(fn(1), name).toBeCloseTo(1, 5)
    }
  })

  it('linear is the identity function', () => {
    expect(easings.linear(0.37)).toBe(0.37)
  })

  it('symmetric inOut presets return 0.5 at the midpoint', () => {
    expect(easings.easeInOutQuad(0.5)).toBeCloseTo(0.5, 5)
    expect(easings.easeInOutCubic(0.5)).toBeCloseTo(0.5, 5)
    expect(easings.easeInOutSine(0.5)).toBeCloseTo(0.5, 5)
  })

  it('easeIn presets start slower than linear', () => {
    expect(easings.easeInQuad(0.5)).toBeLessThan(0.5)
    expect(easings.easeInCubic(0.5)).toBeLessThan(0.5)
  })

  it('easeOut presets start faster than linear', () => {
    expect(easings.easeOutQuad(0.5)).toBeGreaterThan(0.5)
    expect(easings.easeOutCubic(0.5)).toBeGreaterThan(0.5)
  })
})
