export class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = []

  readonly root: Element | Document | null
  readonly rootMargin: string
  readonly thresholds: ReadonlyArray<number>
  elements = new Set<Element>()

  constructor(
    private callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {}
  ) {
    this.root = options.root ?? null
    this.rootMargin = options.rootMargin ?? '0px'
    this.thresholds = Array.isArray(options.threshold) ? options.threshold : [options.threshold ?? 0]
    MockIntersectionObserver.instances.push(this)
  }

  observe(el: Element) {
    this.elements.add(el)
  }

  unobserve(el: Element) {
    this.elements.delete(el)
  }

  disconnect() {
    this.elements.clear()
  }

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }

  /** Test helper: fire entries through this observer's callback. */
  trigger(entries: Array<Partial<IntersectionObserverEntry> & { target: Element }>) {
    const full = entries.map((entry) => ({
      isIntersecting: false,
      intersectionRatio: 0,
      boundingClientRect: { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 } as DOMRectReadOnly,
      rootBounds: null,
      intersectionRect: {} as DOMRectReadOnly,
      time: 0,
      ...entry,
    })) as IntersectionObserverEntry[]
    this.callback(full, this)
  }
}

export function installIntersectionObserverMock() {
  const original = globalThis.IntersectionObserver
  MockIntersectionObserver.instances = []
  globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
  return {
    restore() {
      globalThis.IntersectionObserver = original
    },
  }
}
