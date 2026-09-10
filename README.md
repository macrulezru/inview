# **Inview**

![Inview](https://github.com/macrulezru/assets/blob/master/packages-images/inview-vuecraft.png?raw=true)

Framework-agnostic engines for scroll tracking, element visibility, and
viewport-relative position — with adapters for Vue 3, Nuxt, and React
sharing one `requestAnimationFrame` loop and a pooled
`IntersectionObserver`. Pick the package for your framework; the
underlying engines and the options/behavior they expose stay the same
either way.

---

## Packages

| Package | Description |
| --- | --- |
| [`@macrulez/inview-core`](packages/core) | Framework-agnostic engine — no Vue, no React, just `subscribe`/`unsubscribe` functions any adapter can wrap. |
| [`@macrulez/inview-vue`](packages/vue) | Vue 3 composables: `useScroll`, `useElementVisibility`, `useElementViewport`, `useParallaxLayer`. |
| [`@macrulez/inview-nuxt`](packages/nuxt) | Nuxt module wrapping the Vue package — auto-imports, SSR-safe defaults from `nuxt.config.ts`. |
| [`@macrulez/inview-react`](packages/react) | React hooks on `useSyncExternalStore`, mirroring the Vue adapter's API 1:1. |

---

## Features

- **Scroll tracking** — position, direction, progress, and velocity for the window or an element, all derived on one shared `requestAnimationFrame` loop instead of a separate loop per subscriber
- **Visibility tracking** — reactive `IntersectionObserver`-backed visibility with enter/leave edge detection and a `once` mode; observers are pooled by `(root, rootMargin, threshold)`, so many elements with the same options share one native observer
- **Element viewport position** — an element's bounding rect, how far it's traveled through the viewport (`viewportProgress`, 0..1), and its distance from the viewport's center
- **A parallax layer primitive** — turns `viewportProgress` into a CSS transform with a configurable speed, axis, edge clamping, and easing, and disables itself under `prefers-reduced-motion` automatically
- **SSR-safe everywhere** — every engine and composable/hook returns a static no-op snapshot without a `window`, and starts a real subscription once it's actually running on the client — no `<ClientOnly>` wrapping required
- **Vue, Nuxt, and React adapters over one core** — the same four capabilities exist as Vue composables, auto-imported Nuxt composables, and React hooks with the same API and behavior
- **Zero peer dependencies in core** — `@macrulez/inview-core` runs anywhere, including outside a framework entirely

---

## When you'd reach for this

Reveal-on-scroll effects, parallax, a reading-progress indicator — a common enough need that usually gets solved either with a heavy animation library or hand-rolled scroll listeners and `IntersectionObserver`s duplicated in every component. Inview handles that mechanics once, at the shared-engine level.

- **Every component wires up its own scroll listener** — Ten components reacting to scroll means ten `addEventListener("scroll")` calls and ten recalculations per frame. Scroll state instead flows through one shared rAF loop — any number of subscribers, but only one real listener per distinct set of options.
- **A feed of hundreds of cards, each revealing itself at its own moment** — Watching each one with its own `IntersectionObserver` means hundreds of instances on a single page. Cards that share the same tracking options share one observer instead of spawning one each.
- **A Nuxt page renders on the server, where there's no window** — A composable that just throws or returns garbage on the server is a common source of hydration warnings. Every engine and composable is SSR-safe out of the box.
- **The same tracking logic is needed in both a Vue app and a React app** — A design system, or a project mid-migration where some screens are Vue and some are React. The hooks mirror the composables 1:1 because both are built on the same framework-agnostic core underneath.

---

## Installation

| Peer dependency | Required |
| --- | --- |
| Node.js `18+` | always |
| Vue `^3.3.0` | only for `@macrulez/inview-vue` |
| Nuxt `^3.9.0 \|\| ^4.0.0` | only for `@macrulez/inview-nuxt` |
| React `^18.0.0 \|\| ^19.0.0` | only for `@macrulez/inview-react` |

Install whichever adapter matches your project — each one already depends on `@macrulez/inview-core`, so you don't need to install core yourself unless you're using it directly, with no framework:

```bash
npm install @macrulez/inview-core   # framework-agnostic core only
npm install @macrulez/inview-vue    # Vue 3
npm install @macrulez/inview-nuxt   # Nuxt (pulls in the Vue adapter)
npm install @macrulez/inview-react  # React
```

### Quick start — Vanilla / Core

```ts
import { createScrollEngine } from '@macrulez/inview-core'

const scroll = createScrollEngine()

scroll.subscribe((state) => {
  console.log(state.y, state.direction, state.progress)
})
```

### Quick start — Vue

```vue
<script setup>
import { useScroll } from '@macrulez/inview-vue'

const { y, direction, progress } = useScroll()
</script>

<template>
  <div>{{ y }}px, scrolling {{ direction }}, {{ Math.round(progress * 100) }}%</div>
</template>
```

### Quick start — Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@macrulez/inview-nuxt'],
  inview: {
    defaultRootMargin: '-10% 0px',
  },
})
```

```vue
<script setup>
// useScroll is auto-imported — no explicit import needed
const { y, isScrolling } = useScroll()
</script>
```

### Quick start — React

```tsx
import { useScroll } from '@macrulez/inview-react'

function ScrollIndicator() {
  const { y, direction, progress } = useScroll()
  return (
    <div>
      {y}px, scrolling {direction}, {Math.round(progress * 100)}%
    </div>
  )
}
```

### More examples

#### Reveal-on-scroll, once

`once: true` stops observing the moment an element has appeared — the common "fade this card in the first time it's seen" case, without re-triggering on every scroll back and forth.

```vue
<script setup>
import { useTemplateRef } from 'vue'
import { useElementVisibility } from '@macrulez/inview-vue'

const card = useTemplateRef('card')
const { isVisible } = useElementVisibility(card, { threshold: 0.3, once: true })
</script>

<template>
  <div ref="card" :class="{ 'is-visible': isVisible }">...</div>
</template>
```

#### Two layers, two speeds

`useParallaxLayer` (or `useElementViewport` directly, for full control) turns scroll position into a CSS transform — stack a few at different `speed`s for a classic parallax scene, all driven by the same shared rAF loop.

```vue
<script setup>
import { useTemplateRef } from 'vue'
import { useParallaxLayer } from '@macrulez/inview-vue'

const stage = useTemplateRef('stage')
const back = useParallaxLayer(stage, { speed: 0.2 })
const front = useParallaxLayer(stage, { speed: 1 })
</script>

<template>
  <div ref="stage" class="stage">
    <div class="layer" :style="back.style.value">back</div>
    <div class="layer" :style="front.style.value">front</div>
  </div>
</template>
```

---

## Documentation & links

- 📖 **Full documentation:** [npm.vuecraft.ru/en/packages/inview](https://npm.vuecraft.ru/en/packages/inview/guide/overview.html)
- 🌐 **VueCraft:** [vuecraft.ru/en](https://vuecraft.ru/en)
- 👤 **Author:** [macrulez.ru/en](https://macrulez.ru/en)
- 💻 **GitHub:** [macrulezru/inview](https://github.com/macrulezru/inview)
- 📦 **NPM:** [@macrulez/inview-core](https://www.npmjs.com/package/@macrulez/inview-core)
- 🐛 **Issues:** [github.com/macrulezru/inview/issues](https://github.com/macrulezru/inview/issues)

---

## License

MIT

---

## 💖 Support the project

Open source takes time and effort. If this library saves you time or brings value, consider supporting further development.

<a href="https://donate.cryptocloud.plus/M6O34NIN" target="_blank">
  <img src="https://img.shields.io/badge/Donate-CryptoCloud-8A2BE2?style=for-the-badge&logo=cryptocurrency&logoColor=white" alt="Donate via CryptoCloud">
</a>

Thank you for being part of this journey. ❤️
