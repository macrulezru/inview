<script setup lang="ts">
import { bindCSSVar, useElementViewport } from '@macrulez/inview-vue'
import { useTemplateRef, watch } from 'vue'

const stage = useTemplateRef<HTMLElement>('stage')
const { viewportProgress } = useElementViewport(stage)

watch(
  viewportProgress,
  (p) => {
    if (stage.value) bindCSSVar(stage.value, '--p', p)
  },
  { immediate: true }
)
</script>

<template>
  <section>
    <h2>Parallax layers</h2>
    <p>
      The element's <code>viewportProgress</code> is forwarded into the CSS custom property <code>--p</code> via
      <code>bindCSSVar</code> — each layer then decides its own speed in plain CSS.
    </p>
    <div ref="stage" class="parallax-stage">
      <div class="parallax-layer layer-back">speed 0.2</div>
      <div class="parallax-layer layer-mid">speed 0.5</div>
      <div class="parallax-layer layer-front">speed 1.0</div>
    </div>
  </section>
</template>
