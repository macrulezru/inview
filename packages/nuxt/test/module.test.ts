import { beforeEach, describe, expect, it, vi } from 'vitest'

const addImports = vi.fn()
const addPlugin = vi.fn()
const addComponent = vi.fn()

vi.mock('@nuxt/kit', () => ({
  createResolver: () => ({ resolve: (p: string) => `/resolved${p.replace(/^\./, '')}` }),
  addImports,
  addPlugin,
  addComponent,
  defineNuxtModule: <T extends Record<string, unknown>>(definition: {
    defaults: T
    setup: (options: T, nuxt: unknown) => void
  }) => {
    return (inlineOptions: Partial<T>, nuxt: unknown) => {
      const options = { ...definition.defaults, ...inlineOptions }
      return definition.setup(options, nuxt)
    }
  },
}))

function createMockNuxt() {
  return {
    options: {
      runtimeConfig: {
        public: {} as Record<string, unknown>,
      },
    },
  }
}

describe('@macrulez/inview-nuxt module', () => {
  beforeEach(() => {
    addImports.mockClear()
    addPlugin.mockClear()
    addComponent.mockClear()
  })

  it('auto-imports every composable, utility, core engine, and viewport-defaults pair from @macrulez/inview-vue', async () => {
    const { default: inviewModule } = await import('../src/module')
    const nuxt = createMockNuxt()

    // @ts-expect-error the mocked defineNuxtModule returns a plain callable, matching the runtime shape
    inviewModule({}, nuxt)

    const imported = addImports.mock.calls.map((call) => call[0].name)
    expect(imported).toEqual(
      expect.arrayContaining([
        'useScroll',
        'useElementVisibility',
        'useElementViewport',
        'useParallaxLayer',
        'useRevealController',
        'usePrefersReducedMotion',
        'useStagger',
        'useScrollTo',
        'useScrollSpy',
        'mapRange',
        'bindCSSVar',
        'prefersReducedMotion',
        'easings',
        'clamp',
        'staggerDelay',
        'createScrollEngine',
        'createVisibilityEngine',
        'createElementTracker',
        'createRevealController',
        'createScrollSpy',
        'scrollToElement',
        'observerPool',
        'ObserverPool',
        'rafLoop',
        'setViewportDefaults',
        'viewportDefaults',
      ])
    )
    for (const call of addImports.mock.calls) {
      expect(call[0].from).toBe('@macrulez/inview-vue')
    }
  })

  it('registers <InView> as a global component — the one Vue-specific piece this module used to leave out', async () => {
    const { default: inviewModule } = await import('../src/module')
    const nuxt = createMockNuxt()

    // @ts-expect-error see above
    inviewModule({}, nuxt)

    expect(addComponent).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'InView', filePath: '@macrulez/inview-vue' })
    )
  })

  it('registers the client-only plugin', async () => {
    const { default: inviewModule } = await import('../src/module')
    const nuxt = createMockNuxt()

    // @ts-expect-error see above
    inviewModule({}, nuxt)

    expect(addPlugin).toHaveBeenCalledWith('/resolved/runtime/plugin.client')
  })

  it('forwards module options into public runtimeConfig', async () => {
    const { default: inviewModule } = await import('../src/module')
    const nuxt = createMockNuxt()

    // @ts-expect-error see above
    inviewModule({ defaultThreshold: 0.5, defaultRootMargin: '30px', defaultOnce: true }, nuxt)

    expect(nuxt.options.runtimeConfig.public.inview).toEqual({
      defaultThreshold: 0.5,
      defaultRootMargin: '30px',
      defaultOnce: true,
    })
  })

  it('falls back to the module defaults when no options are passed', async () => {
    const { default: inviewModule } = await import('../src/module')
    const nuxt = createMockNuxt()

    // @ts-expect-error see above
    inviewModule({}, nuxt)

    expect(nuxt.options.runtimeConfig.public.inview).toEqual({
      defaultThreshold: 0,
      defaultRootMargin: '0px',
      defaultOnce: false,
    })
  })
})
