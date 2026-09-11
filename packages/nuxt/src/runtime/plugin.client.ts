import { setViewportDefaults, vReveal } from '@macrulez/inview-vue'
import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public.inview as
    | { defaultThreshold?: number | number[]; defaultRootMargin?: string; defaultOnce?: boolean }
    | undefined
  if (config) {
    setViewportDefaults({
      threshold: config.defaultThreshold,
      rootMargin: config.defaultRootMargin,
      once: config.defaultOnce,
    })
  }

  // Registered globally so `v-reveal` works in every component without an
  // explicit import — the directive equivalent of this module already
  // auto-importing the composables.
  nuxtApp.vueApp.directive('reveal', vReveal)
})
