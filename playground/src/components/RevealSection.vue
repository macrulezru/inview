<script setup lang="ts">
import { useElementVisibility } from '@macrulez/inview-vue'
import { useTemplateRef } from 'vue'

defineProps<{ title: string; text: string }>()

const el = useTemplateRef<HTMLElement>('el')
const { isVisible, ratio } = useElementVisibility(el, { threshold: 0.3, once: true })
</script>

<template>
  <section>
    <div ref="el" class="reveal" :class="{ 'is-visible': isVisible }">
      <h2>{{ title }}</h2>
      <p>{{ text }}</p>
      <p style="margin-top: 8px; opacity: 0.5">ratio: {{ ratio.toFixed(2) }}</p>
    </div>
  </section>
</template>
