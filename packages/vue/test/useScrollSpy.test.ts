import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useScrollSpy } from '../src/useScrollSpy'
import { installIntersectionObserverMock, MockIntersectionObserver } from './mocks/intersection-observer'
import { withSetup } from './helpers/withSetup'

describe('useScrollSpy', () => {
  let mock: ReturnType<typeof installIntersectionObserverMock>

  beforeEach(() => {
    mock = installIntersectionObserverMock()
  })

  afterEach(() => {
    mock.restore()
  })

  it('reports the active index reactively as sections intersect', async () => {
    const a = document.createElement('div')
    const b = document.createElement('div')
    const targets = ref([a, b])

    const { result, wrapper } = withSetup(() => useScrollSpy(targets))
    await nextTick()

    expect(result.value).toBe(null)

    const observer = MockIntersectionObserver.instances[0]
    observer.trigger([{ target: b, isIntersecting: true }])

    expect(result.value).toBe(1)

    wrapper.unmount()
  })

  it('stops observing on unmount', async () => {
    const a = document.createElement('div')
    const targets = ref([a])

    const { wrapper } = withSetup(() => useScrollSpy(targets))
    await nextTick()

    const observer = MockIntersectionObserver.instances[0]
    wrapper.unmount()

    expect(observer.elements.size).toBe(0)
  })

  it('does nothing when the targets array is empty', async () => {
    const targets = ref<HTMLElement[]>([])
    const { result, wrapper } = withSetup(() => useScrollSpy(targets))
    await nextTick()

    expect(result.value).toBe(null)
    expect(MockIntersectionObserver.instances.length).toBe(0)

    wrapper.unmount()
  })
})
