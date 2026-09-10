import { setViewportDefaults } from '@macrulez/inview-vue'
import { defineNuxtPlugin, useRuntimeConfig } from 'nuxt/app'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.inview as
    | { defaultThreshold?: number | number[]; defaultRootMargin?: string }
    | undefined
  if (!config) return

  setViewportDefaults({
    threshold: config.defaultThreshold,
    rootMargin: config.defaultRootMargin,
  })
})
