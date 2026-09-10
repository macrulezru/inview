<script setup lang="ts">
import { useParallaxLayer } from '@macrulez/inview-vue'
import { useTemplateRef } from 'vue'

const stage = useTemplateRef<HTMLElement>('stage')

const back = useParallaxLayer(stage, { speed: 0.2 })
const mid = useParallaxLayer(stage, { speed: 0.5 })
const front = useParallaxLayer(stage, { speed: 1 })
</script>

<template>
  <section>
    <h2>useParallaxLayer</h2>
    <p>The same trick as the manual <code>bindCSSVar</code> above, minus the boilerplate: the composable computes
      <code>viewportProgress</code> itself, applies easing, and hands back a ready-made <code>style</code>.</p>
    <div ref="stage" class="parallax-stage">
      <div class="parallax-layer layer-back" :style="back.style.value">speed 0.2</div>
      <div class="parallax-layer layer-mid" :style="mid.style.value">speed 0.5</div>
      <div class="parallax-layer layer-front" :style="front.style.value">speed 1.0</div>
    </div>
  </section>
</template>
