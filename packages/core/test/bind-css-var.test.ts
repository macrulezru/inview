import { describe, expect, it } from 'vitest'
import { bindCSSVar } from '../src/utils/bindCSSVar'

describe('bindCSSVar', () => {
  it('sets a custom property, adding the -- prefix if missing', () => {
    const el = document.createElement('div')
    bindCSSVar(el, 'p', 0.42)
    expect(el.style.getPropertyValue('--p')).toBe('0.42')
  })

  it('accepts a name that already has the -- prefix', () => {
    const el = document.createElement('div')
    bindCSSVar(el, '--offset', 10)
    expect(el.style.getPropertyValue('--offset')).toBe('10')
  })
})
