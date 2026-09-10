# **Inview Vue**

Vue 3 composables for scroll, visibility, and viewport-position
tracking, built on top of
[`@macrulez/inview-core`](https://www.npmjs.com/package/@macrulez/inview-core).
SSR-safe: every composable is a no-op until it resolves a real DOM
element on the client.

Part of the [inview](https://github.com/macrulezru/inview) monorepo.
See also
[`@macrulez/inview-nuxt`](https://www.npmjs.com/package/@macrulez/inview-nuxt)
if you're on Nuxt, and the
[`playground`](https://github.com/macrulezru/inview/tree/master/playground)
for a live example (scroll HUD, reveal animations, parallax layers).

---

## Features

- **`useScroll()`** — reactive scroll state (position, direction, progress, velocity, `isScrolling`) for the window or a scrollable element
- **`useElementVisibility()`** — reactive `IntersectionObserver`-backed visibility, with enter/leave edge detection and a `once` mode; elements sharing the same options reuse a single observer
- **`useElementViewport()`** — an element's rect, `viewportProgress` (0..1 through the viewport), and distance from the viewport's center
- **`useParallaxLayer()`** — a ready-made "layer with its own scroll speed" primitive built on `useElementViewport`, disabling itself automatically under `prefers-reduced-motion`
- **`setViewportDefaults()`** — package-wide fallback for `useElementVisibility`'s `threshold`/`rootMargin`, so you don't repeat the same options everywhere
- **SSR-safe by design** — every composable subscribes lazily once its `target` resolves to a real element on the client, no `<ClientOnly>` needed

---

## When you'd reach for this

The three engines in `@macrulez/inview-core` with Vue's own reactivity wired on top — refs in, refs out, instead of manually subscribing and unsubscribing in `onMounted`/`onUnmounted`.

- **A progress bar or scroll-driven header needs live scroll state** — `useScroll()` gives you `x`/`y`/`direction`/`progress` as refs that just update — no manual event listener or cleanup to write.
- **A card should fade in once, the first time it's seen** — `useElementVisibility(el, { once: true })` stops observing automatically the moment it fires, instead of you tracking "have I already shown this" yourself.
- **A hero section needs a background that moves slower than the foreground** — `useParallaxLayer()` turns scroll position into a ready CSS `transform`, at whatever relative `speed` you pick per layer.
- **The same visibility options get passed to every observed element on the page** — `setViewportDefaults()` sets the fallback once, instead of repeating `{ threshold: 0.2, rootMargin: '-10%' }` at every call site.

---

## Installation

Requires Vue `^3.3.0` (for `toValue`/`MaybeRefOrGetter`).

```bash
npm install @macrulez/inview-vue
```

### Quick start

```vue
<script setup>
import { useScroll } from '@macrulez/inview-vue'

const { x, y, direction, progress, velocity, isScrolling, scrollTo } = useScroll()
// or useScroll(myContainerRef) to track a scrollable element instead of window
</script>

<template>
  <div class="progress-bar" :style="{ width: `${progress * 100}%` }" />
</template>
```

`target` accepts a ref, a getter, or a plain value (`MaybeRefOrGetter`). `options.idleTimeout` controls how long (ms) after the last scroll event `isScrolling` stays `true` (default 150).

### More examples

#### `useElementVisibility(target, options?)`

```vue
<script setup>
import { useTemplateRef } from 'vue'
import { useElementVisibility } from '@macrulez/inview-vue'

const el = useTemplateRef('el')
const { isVisible, ratio } = useElementVisibility(el, {
  threshold: 0.3,
  once: true, // fire once, then stop observing — the reveal-on-scroll case
  onEnter: (info) => console.log(info.edge),
})
</script>

<template>
  <div ref="el" :class="{ 'is-visible': isVisible }">...</div>
</template>
```

Elements sharing the same `threshold`/`rootMargin`/`root` reuse a single `IntersectionObserver` under the hood — you don't pay for one observer per component instance.

| Option | Default | |
| --- | --- | --- |
| `threshold` | `0` | number or number[] |
| `rootMargin` | `'0px'` | |
| `root` | viewport | `MaybeRefOrGetter<HTMLElement \| null>` |
| `once` | `false` | stop observing after the first intersection |
| `onEnter` / `onLeave` | — | called with `{ isIntersecting, intersectionRatio, boundingClientRect, edge }` |

`threshold`/`rootMargin` fall back to `viewportDefaults` (see `setViewportDefaults` below) when omitted.

#### `useElementViewport(target)`

```ts
const { rect, viewportProgress, distanceFromCenter } = useElementViewport(el)
```

`viewportProgress` (0..1) is the value most parallax effects are built on: 0 when the element just enters at the viewport's bottom edge, 1 when it leaves at the top edge.

#### `useParallaxLayer(target, options)`

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

| Option | Default | |
| --- | --- | --- |
| `speed` | required | `1` moves with scroll, `>1` faster, `<1` slower, negative reverses direction |
| `axis` | `'y'` | `'x' \| 'y'` |
| `range` | `100` | px offset amplitude at `speed: 1` |
| `clamp` | `false` | clamp the offset at the 0/1 progress edges instead of extrapolating |
| `easing` | — | applied to `viewportProgress` before mapping it to an offset — see `easings` from `@macrulez/inview-core` |

#### `setViewportDefaults` / `viewportDefaults`

Package-wide fallback for `useElementVisibility`'s `threshold`/`rootMargin`, so you don't have to pass the same options to every call site. This is what
[`@macrulez/inview-nuxt`](https://www.npmjs.com/package/@macrulez/inview-nuxt)'s
module options configure under the hood — call it directly if you're not using Nuxt:

```ts
import { setViewportDefaults } from '@macrulez/inview-vue'

setViewportDefaults({ threshold: 0.2, rootMargin: '-10%' })
```

#### Low-level utilities

Re-exported from core for convenience: `mapRange`, `bindCSSVar`, `prefersReducedMotion`, `easings`. See
[`@macrulez/inview-core`'s README](https://www.npmjs.com/package/@macrulez/inview-core)
for their signatures.

---

## Documentation & links

- 📖 **Full documentation:** [npm.vuecraft.ru/en/packages/inview](https://npm.vuecraft.ru/en/packages/inview/guide/use-scroll.html)
- 🌐 **VueCraft:** [vuecraft.ru/en](https://vuecraft.ru/en)
- 👤 **Author:** [macrulez.ru/en](https://macrulez.ru/en)
- 💻 **GitHub:** [macrulezru/inview/packages/vue](https://github.com/macrulezru/inview/tree/master/packages/vue)
- 📦 **NPM:** [@macrulez/inview-vue](https://www.npmjs.com/package/@macrulez/inview-vue)
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
