import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRevealController } from '../src/reveal-controller'
import { installIntersectionObserverMock, MockIntersectionObserver } from './mocks/intersection-observer'

function flushMutations() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('createRevealController', () => {
  let mock: ReturnType<typeof installIntersectionObserverMock>

  beforeEach(() => {
    mock = installIntersectionObserverMock()
  })

  afterEach(() => {
    mock.restore()
    document.body.innerHTML = ''
  })

  it('observes elements already in the DOM matching the default selector', () => {
    document.body.innerHTML = '<div class="reveal"></div><div data-reveal></div><div></div>'
    const controller = createRevealController()

    expect(MockIntersectionObserver.instances[0].elements.size).toBe(2)

    controller.destroy()
  })

  it('toggles the default "in" class on intersect', () => {
    document.body.innerHTML = '<div class="reveal"></div>'
    const el = document.querySelector('.reveal') as HTMLElement
    const controller = createRevealController()

    MockIntersectionObserver.instances[0].trigger([{ target: el, isIntersecting: true }])
    expect(el.classList.contains('in')).toBe(true)

    controller.destroy()
  })

  it('defaults to once: true, unlike useElementVisibility', () => {
    document.body.innerHTML = '<div class="reveal"></div>'
    const el = document.querySelector('.reveal') as HTMLElement
    const controller = createRevealController()

    const observer = MockIntersectionObserver.instances[0]
    observer.trigger([{ target: el, isIntersecting: true }])
    expect(observer.elements.has(el)).toBe(false)

    controller.destroy()
  })

  it('respects a per-element data-reveal-once="false" override', () => {
    document.body.innerHTML = '<div class="reveal" data-reveal-once="false"></div>'
    const el = document.querySelector('.reveal') as HTMLElement
    const controller = createRevealController()

    const observer = MockIntersectionObserver.instances[0]
    observer.trigger([{ target: el, isIntersecting: true }])
    expect(el.classList.contains('in')).toBe(true)
    expect(observer.elements.has(el)).toBe(true)

    observer.trigger([{ target: el, isIntersecting: false }])
    expect(el.classList.contains('in')).toBe(false)

    controller.destroy()
  })

  it('respects a per-element data-reveal-class override', () => {
    document.body.innerHTML = '<div class="reveal" data-reveal-class="visible"></div>'
    const el = document.querySelector('.reveal') as HTMLElement
    const controller = createRevealController({ activeClass: 'in' })

    MockIntersectionObserver.instances[0].trigger([{ target: el, isIntersecting: true }])
    expect(el.classList.contains('visible')).toBe(true)
    expect(el.classList.contains('in')).toBe(false)

    controller.destroy()
  })

  it('sets activeAttribute alongside activeClass when configured', () => {
    document.body.innerHTML = '<div class="reveal"></div>'
    const el = document.querySelector('.reveal') as HTMLElement
    const controller = createRevealController({ activeAttribute: 'data-reveal-active', once: false })

    const observer = MockIntersectionObserver.instances[0]
    observer.trigger([{ target: el, isIntersecting: true }])
    expect(el.hasAttribute('data-reveal-active')).toBe(true)

    observer.trigger([{ target: el, isIntersecting: false }])
    expect(el.hasAttribute('data-reveal-active')).toBe(false)

    controller.destroy()
  })

  it('writes a stagger delay CSS var in discovery order by default', () => {
    document.body.innerHTML = '<div class="reveal" id="a"></div><div class="reveal" id="b"></div>'
    const controller = createRevealController({ stagger: { step: 70 } })

    expect((document.getElementById('a') as HTMLElement).style.getPropertyValue('--reveal-delay')).toBe('0ms')
    expect((document.getElementById('b') as HTMLElement).style.getPropertyValue('--reveal-delay')).toBe('70ms')

    controller.destroy()
  })

  it('honors an explicit data-reveal-delay override', () => {
    document.body.innerHTML = '<div class="reveal" data-reveal-delay="140"></div>'
    const el = document.querySelector('.reveal') as HTMLElement
    const controller = createRevealController({ stagger: { step: 70 } })

    expect(el.style.getPropertyValue('--reveal-delay')).toBe('140ms')

    controller.destroy()
  })

  it('counts stagger index per data-reveal-group instead of globally', () => {
    document.body.innerHTML = `
      <div class="reveal" data-reveal-group="a" id="a1"></div>
      <div class="reveal" data-reveal-group="b" id="b1"></div>
      <div class="reveal" data-reveal-group="a" id="a2"></div>
    `
    const controller = createRevealController({ stagger: { step: 50 } })

    expect((document.getElementById('a1') as HTMLElement).style.getPropertyValue('--reveal-delay')).toBe('0ms')
    expect((document.getElementById('b1') as HTMLElement).style.getPropertyValue('--reveal-delay')).toBe('0ms')
    expect((document.getElementById('a2') as HTMLElement).style.getPropertyValue('--reveal-delay')).toBe('50ms')

    controller.destroy()
  })

  it('does not write a stagger var when stagger is false', () => {
    document.body.innerHTML = '<div class="reveal"></div>'
    const el = document.querySelector('.reveal') as HTMLElement
    const controller = createRevealController({ stagger: false })

    expect(el.style.getPropertyValue('--reveal-delay')).toBe('')

    controller.destroy()
  })

  it('sets an inline transition-delay in addition to the CSS var by default', () => {
    document.body.innerHTML = '<div class="reveal" id="a"></div><div class="reveal" id="b"></div>'
    const controller = createRevealController({ stagger: { step: 70 } })

    const a = document.getElementById('a') as HTMLElement
    const b = document.getElementById('b') as HTMLElement
    expect(a.style.getPropertyValue('--reveal-delay')).toBe('0ms')
    expect(a.style.transitionDelay).toBe('0ms')
    expect(b.style.getPropertyValue('--reveal-delay')).toBe('70ms')
    expect(b.style.transitionDelay).toBe('70ms')

    controller.destroy()
  })

  it('skips the inline transition-delay when applyInlineDelay is false', () => {
    document.body.innerHTML = '<div class="reveal"></div>'
    const el = document.querySelector('.reveal') as HTMLElement
    const controller = createRevealController({ stagger: { step: 70, applyInlineDelay: false } })

    expect(el.style.getPropertyValue('--reveal-delay')).toBe('0ms')
    expect(el.style.transitionDelay).toBe('')

    controller.destroy()
  })

  it('skips the CSS var but still sets the inline delay when cssVar is null', () => {
    document.body.innerHTML = '<div class="reveal"></div>'
    const el = document.querySelector('.reveal') as HTMLElement
    const controller = createRevealController({ stagger: { step: 70, cssVar: null } })

    expect(el.style.getPropertyValue('--reveal-delay')).toBe('')
    expect(el.style.transitionDelay).toBe('0ms')

    controller.destroy()
  })

  it('picks up elements added to the DOM later via MutationObserver', async () => {
    const controller = createRevealController()
    expect(MockIntersectionObserver.instances.length).toBe(0)

    const el = document.createElement('div')
    el.className = 'reveal'
    document.body.appendChild(el)
    await flushMutations()

    expect(MockIntersectionObserver.instances[0].elements.has(el)).toBe(true)

    controller.destroy()
  })

  it('unobserves elements removed from the DOM', async () => {
    document.body.innerHTML = '<div class="reveal"></div>'
    const el = document.querySelector('.reveal') as HTMLElement
    const controller = createRevealController()

    const observer = MockIntersectionObserver.instances[0]
    expect(observer.elements.has(el)).toBe(true)

    el.remove()
    await flushMutations()

    expect(observer.elements.has(el)).toBe(false)

    controller.destroy()
  })

  it('does not watch for mutations when watchMutations is false', async () => {
    const controller = createRevealController({ watchMutations: false })

    const el = document.createElement('div')
    el.className = 'reveal'
    document.body.appendChild(el)
    await flushMutations()

    expect(MockIntersectionObserver.instances.length).toBe(0)

    controller.refresh()
    expect(MockIntersectionObserver.instances[0].elements.has(el)).toBe(true)

    controller.destroy()
  })

  it('calls onEnter/onLeave with the element and the intersection info', () => {
    document.body.innerHTML = '<div class="reveal"></div>'
    const el = document.querySelector('.reveal') as HTMLElement
    const onEnter = vi.fn()
    const controller = createRevealController({ onEnter, once: false })

    MockIntersectionObserver.instances[0].trigger([
      { target: el, isIntersecting: true, boundingClientRect: { top: 500 } as DOMRectReadOnly },
    ])

    expect(onEnter).toHaveBeenCalledWith(el, expect.objectContaining({ isIntersecting: true }))

    controller.destroy()
  })

  it('respects a custom selector', () => {
    document.body.innerHTML = '<div class="reveal"></div><div data-fade></div>'
    const controller = createRevealController({ selector: '[data-fade]' })

    expect(MockIntersectionObserver.instances[0].elements.size).toBe(1)

    controller.destroy()
  })

  it('clears the inline transition-delay and CSS var once the reveal transition ends', () => {
    document.body.innerHTML = '<div class="reveal" id="a"></div><div class="reveal" id="b"></div>'
    const b = document.getElementById('b') as HTMLElement
    const controller = createRevealController({ stagger: { step: 70 } })

    MockIntersectionObserver.instances[0].trigger([{ target: b, isIntersecting: true }])
    expect(b.style.transitionDelay).toBe('70ms')
    expect(b.style.getPropertyValue('--reveal-delay')).toBe('70ms')

    b.dispatchEvent(new Event('transitionend'))
    expect(b.style.transitionDelay).toBe('')
    expect(b.style.getPropertyValue('--reveal-delay')).toBe('')

    controller.destroy()
  })

  it('does not let the stagger delay bleed into a later hover transition on the same element', () => {
    // Simulates the real-world case: a `.reveal` element that is ALSO a link
    // with its own hover transition — once the reveal-in transition ends,
    // the inline transition-delay it used must be gone, or the next
    // (unrelated) transition on this element inherits the same delay.
    document.body.innerHTML = '<a class="reveal" href="#" id="link"></a>'
    const el = document.getElementById('link') as HTMLElement
    const controller = createRevealController({ stagger: { step: 200 } })

    MockIntersectionObserver.instances[0].trigger([{ target: el, isIntersecting: true }])
    expect(el.style.transitionDelay).toBe('0ms')

    el.dispatchEvent(new Event('transitionend'))
    expect(el.style.transitionDelay).toBe('')

    // A later, unrelated hover-triggered transition is free to set its own
    // delay (or none) without any leftover reveal delay interfering.
    el.style.setProperty('transition-delay', '0ms')
    expect(el.style.transitionDelay).toBe('0ms')

    controller.destroy()
  })

  it('falls back to a computed-duration timer when no transitionend ever fires', () => {
    vi.useFakeTimers()
    try {
      document.body.innerHTML = '<div class="reveal" id="a" style="transition-duration: 0.3s"></div>'
      const el = document.getElementById('a') as HTMLElement
      const controller = createRevealController({ stagger: { step: 100 } })

      MockIntersectionObserver.instances[0].trigger([{ target: el, isIntersecting: true }])
      expect(el.style.transitionDelay).toBe('0ms')

      vi.advanceTimersByTime(300 + 50)
      expect(el.style.transitionDelay).toBe('')

      controller.destroy()
    } finally {
      vi.useRealTimers()
    }
  })

  it('reapplies and re-clears the stagger delay on every entry when once is false', () => {
    document.body.innerHTML = '<div class="reveal" id="a"></div>'
    const el = document.getElementById('a') as HTMLElement
    const controller = createRevealController({ stagger: { step: 90 }, once: false })
    const observer = MockIntersectionObserver.instances[0]

    observer.trigger([{ target: el, isIntersecting: true }])
    expect(el.style.transitionDelay).toBe('0ms')
    el.dispatchEvent(new Event('transitionend'))
    expect(el.style.transitionDelay).toBe('')

    observer.trigger([{ target: el, isIntersecting: false }])
    observer.trigger([{ target: el, isIntersecting: true }])
    expect(el.style.transitionDelay).toBe('0ms')
    el.dispatchEvent(new Event('transitionend'))
    expect(el.style.transitionDelay).toBe('')

    controller.destroy()
  })

  it('clears a pending stagger cleanup when the element is removed from the DOM', async () => {
    document.body.innerHTML = '<div class="reveal" id="a"></div>'
    const el = document.getElementById('a') as HTMLElement
    const controller = createRevealController({ stagger: { step: 100 } })

    MockIntersectionObserver.instances[0].trigger([{ target: el, isIntersecting: true }])
    expect(el.style.transitionDelay).toBe('0ms')

    el.remove()
    await flushMutations()

    expect(el.style.transitionDelay).toBe('')

    controller.destroy()
  })

  it('stops observing and disconnects the mutation watcher on destroy', async () => {
    document.body.innerHTML = '<div class="reveal"></div>'
    const controller = createRevealController()
    const observer = MockIntersectionObserver.instances[0]

    controller.destroy()
    expect(observer.elements.size).toBe(0)

    const el = document.createElement('div')
    el.className = 'reveal'
    document.body.appendChild(el)
    await flushMutations()

    expect(MockIntersectionObserver.instances.length).toBe(1) // no new observer created after destroy
  })
})
