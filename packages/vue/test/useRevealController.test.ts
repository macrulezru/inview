import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useRevealController } from '../src/useRevealController'
import { installIntersectionObserverMock, MockIntersectionObserver } from './mocks/intersection-observer'
import { withSetup } from './helpers/withSetup'

function flushMutations() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('useRevealController', () => {
  let mock: ReturnType<typeof installIntersectionObserverMock>

  beforeEach(() => {
    mock = installIntersectionObserverMock()
  })

  afterEach(() => {
    mock.restore()
    document.body.innerHTML = ''
  })

  it('creates the controller once mounted, scanning elements already in the DOM', () => {
    document.body.innerHTML = '<div class="reveal"></div>'
    const el = document.querySelector('.reveal') as HTMLElement

    const { wrapper } = withSetup(() => useRevealController())

    expect(MockIntersectionObserver.instances[0].elements.has(el)).toBe(true)

    wrapper.unmount()
  })

  it('destroys the controller automatically on unmount', () => {
    document.body.innerHTML = '<div class="reveal"></div>'

    const { wrapper } = withSetup(() => useRevealController())
    const observer = MockIntersectionObserver.instances[0]

    wrapper.unmount()

    expect(observer.elements.size).toBe(0)
  })

  it('exposes a working refresh() that re-scans the DOM', async () => {
    const { result, wrapper } = withSetup(() => useRevealController({ watchMutations: false }))

    const el = document.createElement('div')
    el.className = 'reveal'
    document.body.appendChild(el)
    await flushMutations()

    expect(MockIntersectionObserver.instances.length).toBe(0)

    result.refresh()

    expect(MockIntersectionObserver.instances[0].elements.has(el)).toBe(true)

    wrapper.unmount()
  })

  it('exposes a working destroy() before unmount', () => {
    document.body.innerHTML = '<div class="reveal"></div>'

    const { result, wrapper } = withSetup(() => useRevealController())
    const observer = MockIntersectionObserver.instances[0]

    result.destroy()

    expect(observer.elements.size).toBe(0)

    wrapper.unmount()
  })

  it('passes options through to the underlying createRevealController', () => {
    document.body.innerHTML = '<div class="reveal"></div>'
    const el = document.querySelector('.reveal') as HTMLElement

    const { wrapper } = withSetup(() => useRevealController({ activeClass: 'visible' }))

    MockIntersectionObserver.instances[0].trigger([{ target: el, isIntersecting: true }])
    expect(el.classList.contains('visible')).toBe(true)

    wrapper.unmount()
  })
})
