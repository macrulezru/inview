type Tick = (time: number) => void

/**
 * One shared requestAnimationFrame loop for the whole engine, instead of
 * every scroll/tracker subscription running its own rAF callback.
 */
class RafLoop {
  private callbacks = new Set<Tick>()
  private handle: number | null = null

  add(cb: Tick): () => void {
    this.callbacks.add(cb)
    this.start()
    return () => {
      this.callbacks.delete(cb)
      if (this.callbacks.size === 0) this.stop()
    }
  }

  private start() {
    if (this.handle !== null || typeof requestAnimationFrame === 'undefined') return
    const loop: FrameRequestCallback = (time) => {
      this.callbacks.forEach((cb) => cb(time))
      if (this.callbacks.size > 0) {
        this.handle = requestAnimationFrame(loop)
      } else {
        this.handle = null
      }
    }
    this.handle = requestAnimationFrame(loop)
  }

  private stop() {
    if (this.handle !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.handle)
    }
    this.handle = null
  }
}

export const rafLoop = new RafLoop()
