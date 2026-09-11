import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ObserverPool } from '../src/observer-pool'
import { installIntersectionObserverMock, MockIntersectionObserver } from './mocks/intersection-observer'

describe('ObserverPool', () => {
  let mock: ReturnType<typeof installIntersectionObserverMock>
  let observerPool: ObserverPool

  beforeEach(() => {
    mock = installIntersectionObserverMock()
    observerPool = new ObserverPool()
  })

  afterEach(() => {
    mock.restore()
  })

  it('shares one IntersectionObserver across elements with identical options', () => {
    const elA = document.createElement('div')
    const elB = document.createElement('div')

    observerPool.observe(elA, { threshold: 0.5 }, () => {})
    observerPool.observe(elB, { threshold: 0.5 }, () => {})

    expect(MockIntersectionObserver.instances.length).toBe(1)
    expect(MockIntersectionObserver.instances[0].elements.size).toBe(2)
  })

  it('creates separate observers for different options', () => {
    const elA = document.createElement('div')
    const elB = document.createElement('div')

    observerPool.observe(elA, { threshold: 0 }, () => {})
    observerPool.observe(elB, { threshold: 1 }, () => {})

    expect(MockIntersectionObserver.instances.length).toBe(2)
  })

  it('routes entries only to the callback for the matching element', () => {
    const elA = document.createElement('div')
    const elB = document.createElement('div')
    const callsA: IntersectionObserverEntry[] = []
    const callsB: IntersectionObserverEntry[] = []

    observerPool.observe(elA, { threshold: 0 }, (e) => callsA.push(e))
    observerPool.observe(elB, { threshold: 0 }, (e) => callsB.push(e))

    const observer = MockIntersectionObserver.instances[0]
    observer.trigger([{ target: elA, isIntersecting: true }])

    expect(callsA.length).toBe(1)
    expect(callsB.length).toBe(0)
  })

  it('disconnects the underlying observer once the last element unsubscribes', () => {
    const el = document.createElement('div')
    const unobserve = observerPool.observe(el, { threshold: 0 }, () => {})

    const observer = MockIntersectionObserver.instances[0]
    unobserve()

    expect(observer.elements.size).toBe(0)
  })

  describe('stats', () => {
    it('reports an empty list when nothing is observed', () => {
      expect(observerPool.stats()).toEqual([])
    })

    it('reports one entry per pooled key with its element count', () => {
      const elA = document.createElement('div')
      const elB = document.createElement('div')
      const elC = document.createElement('div')

      observerPool.observe(elA, { threshold: 0.5 }, () => {})
      observerPool.observe(elB, { threshold: 0.5 }, () => {})
      observerPool.observe(elC, { threshold: 1 }, () => {})

      const stats = observerPool.stats()
      expect(stats).toHaveLength(2)
      expect(stats).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ elementCount: 2 }),
          expect.objectContaining({ elementCount: 1 }),
        ])
      )
    })

    it('drops an entry once its observer disconnects', () => {
      const el = document.createElement('div')
      const unobserve = observerPool.observe(el, { threshold: 0 }, () => {})

      expect(observerPool.stats()).toHaveLength(1)

      unobserve()

      expect(observerPool.stats()).toEqual([])
    })
  })
})
