import { addImports, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'

export interface ModuleOptions {
  /** default 0 */
  defaultThreshold?: number | number[]
  /** default '0px' */
  defaultRootMargin?: string
}

const COMPOSABLES = ['useScroll', 'useElementVisibility', 'useElementViewport', 'useParallaxLayer']
const UTILS = ['mapRange', 'bindCSSVar', 'prefersReducedMotion', 'easings']

const inviewModule: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@macrulez/inview-nuxt',
    configKey: 'inview',
  },
  defaults: {
    defaultThreshold: 0,
    defaultRootMargin: '0px',
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    for (const name of [...COMPOSABLES, ...UTILS]) {
      addImports({ name, from: '@macrulez/inview-vue' })
    }

    nuxt.options.runtimeConfig.public.inview = {
      defaultThreshold: options.defaultThreshold,
      defaultRootMargin: options.defaultRootMargin,
    }

    // Applies module options on the client only — the underlying composables
    // are already SSR-safe no-ops, this just seeds their client-side defaults.
    addPlugin(resolver.resolve('./runtime/plugin.client'))
  },
})

export default inviewModule
