type ChangeListener = (event: { matches: boolean }) => void

class MockMediaQueryList {
  matches: boolean
  media: string
  private listeners = new Set<ChangeListener>()

  constructor(media: string, matches: boolean) {
    this.media = media
    this.matches = matches
  }

  addEventListener(type: string, cb: ChangeListener) {
    if (type === 'change') this.listeners.add(cb)
  }

  removeEventListener(type: string, cb: ChangeListener) {
    if (type === 'change') this.listeners.delete(cb)
  }

  dispatchEvent(): boolean {
    return true
  }

  /** simulates the OS setting changing, notifying every subscribed listener */
  trigger(matches: boolean) {
    this.matches = matches
    this.listeners.forEach((cb) => cb({ matches }))
  }
}

/**
 * Installs a `window.matchMedia` mock that caches one `MockMediaQueryList`
 * per query string, so repeated `matchMedia(sameQuery)` calls (a fresh read,
 * and a separate `addEventListener` subscription) share the same instance —
 * required for `.trigger()` to actually reach a subscriber.
 */
export function installMatchMediaMock(initialMatches = false) {
  const original = window.matchMedia
  const instances = new Map<string, MockMediaQueryList>()

  window.matchMedia = ((query: string) => {
    let mql = instances.get(query)
    if (!mql) {
      mql = new MockMediaQueryList(query, initialMatches)
      instances.set(query, mql)
    }
    return mql as unknown as MediaQueryList
  }) as typeof window.matchMedia

  return {
    get(query: string) {
      return instances.get(query)
    },
    restore() {
      window.matchMedia = original
    },
  }
}
