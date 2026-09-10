/**
 * Deterministic requestAnimationFrame mock. Each call to `flush()` runs
 * exactly the callbacks scheduled so far, mirroring one animation frame.
 */
export function installRafMock() {
  const originalRaf = globalThis.requestAnimationFrame
  const originalCaf = globalThis.cancelAnimationFrame

  let nextId = 1
  let pending = new Map<number, FrameRequestCallback>()

  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    const id = nextId++
    pending.set(id, cb)
    return id
  }) as typeof requestAnimationFrame

  globalThis.cancelAnimationFrame = ((id: number) => {
    pending.delete(id)
  }) as typeof cancelAnimationFrame

  return {
    flush(time = 0) {
      const callbacks = Array.from(pending.values())
      pending = new Map()
      callbacks.forEach((cb) => cb(time))
    },
    restore() {
      globalThis.requestAnimationFrame = originalRaf
      globalThis.cancelAnimationFrame = originalCaf
    },
  }
}
