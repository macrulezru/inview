import { describe, expect, it, vi } from 'vitest'

const setViewportDefaults = vi.fn()

vi.mock('@macrulez/inview-vue', () => ({ setViewportDefaults }))

function mockNuxtApp(publicConfig: unknown) {
  vi.doMock('nuxt/app', () => ({
    defineNuxtPlugin: (fn: () => void) => fn,
    useRuntimeConfig: () => ({ public: { inview: publicConfig } }),
  }))
}

describe('inview-nuxt client plugin', () => {
  it('applies defaultThreshold/defaultRootMargin from runtimeConfig', async () => {
    vi.resetModules()
    setViewportDefaults.mockClear()
    mockNuxtApp({ defaultThreshold: 0.4, defaultRootMargin: '15px' })

    const { default: plugin } = await import('../src/runtime/plugin.client')
    plugin()

    expect(setViewportDefaults).toHaveBeenCalledWith({ threshold: 0.4, rootMargin: '15px' })
  })

  it('does nothing when the module was never configured', async () => {
    vi.resetModules()
    setViewportDefaults.mockClear()
    mockNuxtApp(undefined)

    const { default: plugin } = await import('../src/runtime/plugin.client')
    plugin()

    expect(setViewportDefaults).not.toHaveBeenCalled()
  })
})
