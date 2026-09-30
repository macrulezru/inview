import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useStagger } from '../src/useStagger'
import { withSetup } from './helpers/withSetup'

describe('useStagger', () => {
  it('computes the same value as staggerDelay for plain values', () => {
    const { result, wrapper } = withSetup(() => useStagger(3, { step: 70 }))
    expect(result.value).toBe('210ms')
    wrapper.unmount()
  })

  it('recomputes reactively when index is a ref', async () => {
    const index = ref(0)
    const { result, wrapper } = withSetup(() => useStagger(index, { step: 70 }))

    expect(result.value).toBe('0ms')

    index.value = 2
    await nextTick()

    expect(result.value).toBe('140ms')

    wrapper.unmount()
  })

  it('recomputes reactively when options is a ref', async () => {
    const options = ref({ step: 70 })
    const { result, wrapper } = withSetup(() => useStagger(2, options))

    expect(result.value).toBe('140ms')

    options.value = { step: 100 }
    await nextTick()

    expect(result.value).toBe('200ms')

    wrapper.unmount()
  })
})
