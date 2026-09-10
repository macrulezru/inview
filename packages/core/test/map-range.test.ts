import { describe, expect, it } from 'vitest'
import { mapRange } from '../src/utils/mapRange'

describe('mapRange', () => {
  it('maps a value linearly between ranges', () => {
    expect(mapRange(0.5, [0, 1], [0, 100])).toBe(50)
    expect(mapRange(0, [0, 1], [-20, 20])).toBe(-20)
    expect(mapRange(1, [0, 1], [-20, 20])).toBe(20)
  })

  it('extrapolates outside the input range by default', () => {
    expect(mapRange(2, [0, 1], [0, 100])).toBe(200)
    expect(mapRange(-1, [0, 1], [0, 100])).toBe(-100)
  })

  it('clamps to the output range when clampResult is true', () => {
    expect(mapRange(2, [0, 1], [0, 100], true)).toBe(100)
    expect(mapRange(-1, [0, 1], [0, 100], true)).toBe(0)
  })

  it('clamps correctly when the output range is inverted', () => {
    expect(mapRange(2, [0, 1], [100, 0], true)).toBe(0)
    expect(mapRange(-1, [0, 1], [100, 0], true)).toBe(100)
  })

  it('returns the output min when the input range is degenerate', () => {
    expect(mapRange(5, [3, 3], [0, 10])).toBe(0)
  })
})
