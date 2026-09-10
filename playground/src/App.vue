<script setup lang="ts">
import ParallaxLayerSection from './components/ParallaxLayerSection.vue'
import ParallaxSection from './components/ParallaxSection.vue'
import RevealSection from './components/RevealSection.vue'
import ScrollHud from './components/ScrollHud.vue'
</script>

<template>
  <ScrollHud />

  <section>
    <h2>inview</h2>
    <p>Scroll down — the HUD in the corner shows useScroll()'s live state, and the sections below reveal as they appear.</p>
  </section>

  <RevealSection
    title="useElementVisibility"
    text="A wrapper over a shared IntersectionObserver pool — this section reveals once, the first time it crosses 30% intersection."
  />
  <RevealSection
    title="Another section"
    text="Multiple subscribers on different elements share the same observer as long as their threshold/root/rootMargin match."
  />

  <ParallaxSection />
  <ParallaxLayerSection />

  <RevealSection
    title="Done"
    text="Vue adapter, effects layer, Nuxt module and React adapter are all implemented — next up is the should/later backlog (edgeProgress, pin/sticky, directives, <Waypoint>)."
  />
</template>
