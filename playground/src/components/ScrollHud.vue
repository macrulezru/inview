<script setup lang="ts">
import { useScroll } from '@macrulez/inview-vue'

const { y, direction, progress, velocity, isScrolling } = useScroll()
</script>

<template>
  <div class="progress-bar" :style="{ width: `${progress * 100}%` }" />
  <div class="hud">
    <div><b>y</b> {{ Math.round(y) }}</div>
    <div><b>direction</b> {{ direction ?? '—' }}</div>
    <div><b>progress</b> {{ progress.toFixed(2) }}</div>
    <div><b>velocity</b> {{ velocity.toFixed(1) }}</div>
    <div><b>isScrolling</b> {{ isScrolling }}</div>
  </div>
</template>
