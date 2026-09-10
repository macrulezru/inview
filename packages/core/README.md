# **Inview Core**

Framework-agnostic engine for scroll tracking, element visibility, and
viewport-relative position. No Vue, no React — just
`subscribe`/`unsubscribe` functions that any framework adapter can
wrap in its own reactivity.

Part of the [inview](https://github.com/macrulezru/inview) monorepo.
Framework adapters:
[`@macrulez/inview-vue`](https://www.npmjs.com/package/@macrulez/inview-vue),
[`@macrulez/inview-react`](https://www.npmjs.com/package/@macrulez/inview-react),
[`@macrulez/inview-nuxt`](https://www.npmjs.com/package/@macrulez/inview-nuxt).

---

## Features

- **A scroll engine on one shared rAF loop** — position, direction, progress, and velocity for the window or an element, all derived on one shared `requestAnimationFrame` loop ([`rafLoop`](./src/raf-loop.ts)) instead of a separate one per subscriber
- **A visibility engine with a pooled `IntersectionObserver`** — enter/leave edge detection and a `once` mode; observers are pooled by `(root, rootMargin, threshold)` ([`ObserverPool`](./src/observer-pool.ts)) instead of one per observed element
- **Element viewport tracking** — an element's bounding rect, how far it's traveled through the viewport, and its distance from the viewport's center, updated on the shared rAF loop
- **Standalone utilities** — `mapRange`, `bindCSSVar`, `prefersReducedMotion`, `clamp`, and a set of easing presets, usable on their own
- **SSR-safe everywhere** — constructing any engine without a `window` returns a no-op object with a static zero-value state instead of throwing
- **Zero runtime dependencies, zero peer dependencies** — usable standalone in any environment, including outside a framework entirely

---

## When you'd reach for this

You're writing a framework adapter of your own, working somewhere Vue/Nuxt/React aren't an option, or just want the raw engines without any reactivity layer on top.

- **Building a framework adapter for something not already covered** — Svelte, a vanilla web component, a custom internal framework. The engines expose plain `subscribe`/`unsubscribe` functions with no assumptions about how your reactivity works, so wrapping them is a thin layer, not a rewrite.
- **A vanilla script with no build step or framework at all** — Not every page needs Vue or React for one scroll-driven effect. `createScrollEngine()` works the same way loaded straight from a `<script type="module">`.
- **Testing scroll/visibility logic in isolation** — Pass your own `ObserverPool` instance instead of the shared singleton, mock `requestAnimationFrame`, and assert on the engine's state directly, with no component tree in the way.

---

## Installation

```bash
npm install @macrulez/inview-core
```

No peer dependencies. Requires Node.js `18+` if used in a Node/SSR context; in the browser, any environment with `requestAnimationFrame` works, and `IntersectionObserver`-dependent features degrade to no-ops where it's unavailable.

### Quick start

```ts
import { createScrollEngine } from '@macrulez/inview-core'

const engine = createScrollEngine(window, { idleTimeout: 150 })

const unsubscribe = engine.subscribe((state) => {
  // state: { x, y, direction, progress, velocity, isScrolling }
  console.log(state.progress) // 0..1 scroll progress of the page
})

engine.scrollTo({ y: 800 }, { behavior: 'smooth' }) // respects prefers-reduced-motion
unsubscribe()
engine.destroy() // removes the scroll listener and the rAF subscription
```

### More examples

#### `createScrollEngine(target?, options?)`

Tracks scroll position of `window` (default) or a scrollable `HTMLElement`.

| Field | Type | Notes |
| --- | --- | --- |
| `x`, `y` | `number` | Current scroll offset |
| `direction` | `'up' \| 'down' \| 'left' \| 'right' \| null` | Direction of the last scroll delta |
| `progress` | `number` | 0..1, based on whichever axis (x/y) is actually scrollable |
| `velocity` | `number` | px moved per animation frame |
| `isScrolling` | `boolean` | `true` while scrolling, flips back after `idleTimeout` ms (default 150) of inactivity |

#### `createVisibilityEngine(pool?)`

Thin wrapper around a pooled `IntersectionObserver`, adding enter/leave edge detection and a `once` flag.

```ts
import { createVisibilityEngine } from '@macrulez/inview-core'

const engine = createVisibilityEngine()

const stop = engine.observe(
  el,
  { threshold: 0.3, rootMargin: '0px', once: true, onEnter: (info) => console.log(info.edge) },
  (info) => {
    // info: { isIntersecting, intersectionRatio, boundingClientRect, edge }
  },
)
```

`edge` is one of `'enter-top' | 'enter-bottom' | 'leave-top' | 'leave-bottom'`, derived from which side of the root the element crossed. Pass your own `ObserverPool` instance (`new ObserverPool()`) if you need isolation from the module-wide default pool — mainly useful in tests.

#### `createElementTracker(el)`

Tracks an element's position relative to the viewport on the shared rAF loop.

```ts
import { createElementTracker } from '@macrulez/inview-core'

const tracker = createElementTracker(el)
tracker.subscribe((state) => {
  // state: { rect, viewportProgress, distanceFromCenter }
})
```

- `rect` — a plain `{ top, left, right, bottom, width, height }` snapshot of `getBoundingClientRect()`.
- `viewportProgress` — 0..1, from the element entering at the viewport's bottom edge to leaving at its top edge. The core value parallax effects are built on.
- `distanceFromCenter` — px offset between the element's center and the viewport's center (negative = above center).

#### Utilities

```ts
import { mapRange, bindCSSVar, prefersReducedMotion, easings, clamp } from '@macrulez/inview-core'

mapRange(0.5, [0, 1], [0, 100]) // 50, linear remap
mapRange(1.4, [0, 1], [0, 100], true) // 100, clamped to the output range

bindCSSVar(el, '--p', 0.42) // el.style.setProperty('--p', '0.42')

prefersReducedMotion() // matches (prefers-reduced-motion: reduce)

easings.easeInOutQuad(0.5) // 0.5 — see src/easing.ts for the full preset list
```

---

## Documentation & links

- 📖 **Full documentation:** [npm.vuecraft.ru/en/packages/inview](https://npm.vuecraft.ru/en/packages/inview/guide/overview.html)
- 🌐 **VueCraft:** [vuecraft.ru/en](https://vuecraft.ru/en)
- 👤 **Author:** [macrulez.ru/en](https://macrulez.ru/en)
- 💻 **GitHub:** [macrulezru/inview/packages/core](https://github.com/macrulezru/inview/tree/master/packages/core)
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
