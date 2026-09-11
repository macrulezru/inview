import { describe, expect, it, vi } from 'vitest'

const setViewportDefaults = vi.fn()
const vReveal = { mounted: vi.fn(), unmounted: vi.fn() }

vi.mock('@macrulez/inview-vue', () => ({ setViewportDefaults, vReveal }))

function mockNuxtApp(publicConfig: unknown) {
  vi.doMock('nuxt/app', () => ({
    defineNuxtPlugin: (fn: (nuxtApp: unknown) => void) => fn,
    useRuntimeConfig: () => ({ public: { inview: publicConfig } }),
  }))
}

function createFakeNuxtApp() {
  const directive = vi.fn()
  return { nuxtApp: { vueApp: { directive } }, directive }
}

describe('inview-nuxt client plugin', () => {
  it('applies defaultThreshold/defaultRootMargin/defaultOnce from runtimeConfig', async () => {
    vi.resetModules()
    setViewportDefaults.mockClear()
    mockNuxtApp({ defaultThreshold: 0.4, defaultRootMargin: '15px', defaultOnce: true })

    const { default: plugin } = await import('../src/runtime/plugin.client')
    const { nuxtApp } = createFakeNuxtApp()
    plugin(nuxtApp)

    expect(setViewportDefaults).toHaveBeenCalledWith({ threshold: 0.4, rootMargin: '15px', once: true })
  })

  it('skips setViewportDefaults when the module was never configured', async () => {
    vi.resetModules()
    setViewportDefaults.mockClear()
    mockNuxtApp(undefined)

    const { default: plugin } = await import('../src/runtime/plugin.client')
    const { nuxtApp } = createFakeNuxtApp()
    plugin(nuxtApp)

    expect(setViewportDefaults).not.toHaveBeenCalled()
  })

  it('registers v-reveal globally on the Vue app, configured or not', async () => {
    vi.resetModules()
    mockNuxtApp(undefined)

    const { default: plugin } = await import('../src/runtime/plugin.client')
    const { nuxtApp, directive } = createFakeNuxtApp()
    plugin(nuxtApp)

    expect(directive).toHaveBeenCalledWith('reveal', vReveal)
  })
})
