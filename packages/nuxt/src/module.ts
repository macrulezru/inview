import { addComponent, addImports, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'

export interface ModuleOptions {
  /** default 0 */
  defaultThreshold?: number | number[]
  /** default '0px' */
  defaultRootMargin?: string
  /** default false — applies to useElementVisibility, v-reveal, and <InView> alike */
  defaultOnce?: boolean
}

const COMPOSABLES = ['useScroll', 'useElementVisibility', 'useElementViewport', 'useParallaxLayer']
const UTILS = ['mapRange', 'bindCSSVar', 'prefersReducedMotion', 'easings', 'clamp', 'staggerDelay']
// setViewportDefaults is already applied internally from module options (see
// plugin.client.ts), but wasn't reachable for a consumer wanting to call it
// again later or read the live defaults — everything else Vue-specific this
// module wires up (composables, v-reveal, <InView> below) is auto-imported,
// this pair was the one oversight.
const VIEWPORT_DEFAULTS = ['setViewportDefaults', 'viewportDefaults']
// Everything below is @macrulez/inview-core, re-exported through
// @macrulez/inview-vue — the previous version of this module only
// auto-imported the composables/utils above, so reaching the raw engines
// (or createRevealController) meant installing @macrulez/inview-core as a
// separate dependency even though -nuxt already pulls in -vue, which
// already re-exports all of it.
const CORE_ENGINES = [
  'createScrollEngine',
  'createVisibilityEngine',
  'createElementTracker',
  'createRevealController',
  'observerPool',
  'ObserverPool',
  'rafLoop',
]

const inviewModule: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@macrulez/inview-nuxt',
    configKey: 'inview',
  },
  defaults: {
    defaultThreshold: 0,
    defaultRootMargin: '0px',
    defaultOnce: false,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    for (const name of [...COMPOSABLES, ...UTILS, ...CORE_ENGINES, ...VIEWPORT_DEFAULTS]) {
      addImports({ name, from: '@macrulez/inview-vue' })
    }

    // Every other Vue-specific piece of this package (composables, v-reveal)
    // is already wired up above/in plugin.client.ts — <InView> itself, the
    // one actual component, was the missing piece, needing a manual import
    // even under Nuxt.
    addComponent({ name: 'InView', export: 'InView', filePath: '@macrulez/inview-vue' })

    nuxt.options.runtimeConfig.public.inview = {
      defaultThreshold: options.defaultThreshold,
      defaultRootMargin: options.defaultRootMargin,
      defaultOnce: options.defaultOnce,
    }

    // Applies module options on the client only — the underlying composables
    // are already SSR-safe no-ops, this just seeds their client-side defaults
    // (and registers the v-reveal directive globally, see plugin.client.ts).
    addPlugin(resolver.resolve('./runtime/plugin.client'))
  },
})

export default inviewModule
