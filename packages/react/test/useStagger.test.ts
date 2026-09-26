import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useStagger } from '../src/useStagger'

describe('useStagger', () => {
  it('computes the same value as staggerDelay', () => {
    const { result } = renderHook(() => useStagger(3, { step: 70 }))
    expect(result.current).toBe('210ms')
  })

  it('recomputes across re-renders when index changes', () => {
    const { result, rerender } = renderHook(({ index }) => useStagger(index, { step: 70 }), {
      initialProps: { index: 0 },
    })

    expect(result.current).toBe('0ms')

    rerender({ index: 2 })
    expect(result.current).toBe('140ms')
  })
})
