# **Inview Nuxt**

![Inview Nuxt](https://github.com/macrulezru/assets/blob/master/packages-images/inview-nuxt-vuecraft.png?raw=true)

Nuxt module wrapping
[`@macrulez/inview-vue`](https://www.npmjs.com/package/@macrulez/inview-vue):
auto-imported composables, a client-only plugin that seeds their
defaults from your `nuxt.config`, and no manual `<ClientOnly>`
wrapping needed — every composable is already SSR-safe on its own.

Part of the [inview](https://github.com/macrulezru/inview) monorepo.

---

## Features

- **Auto-imports every composable, utility, and core engine** — `useScroll`, `useElementVisibility`, `useElementViewport`, `useParallaxLayer`, `useRevealController`, `usePrefersReducedMotion`, `useStagger`, `useScrollTo`, `useScrollSpy`, `mapRange`, `bindCSSVar`, `prefersReducedMotion`, `clamp`, `easings`, `staggerDelay`, plus the framework-agnostic layer itself (`createScrollEngine`, `createVisibilityEngine`, `createElementTracker`, `createRevealController`, `createScrollSpy`, `scrollToElement`, `observerPool`/`ObserverPool`, `rafLoop`) — no explicit `import` anywhere in your app, and no separate `@macrulez/inview-core` install needed to reach them
- **`v-reveal` registered globally** — toggles a class/attribute on an element as it enters the viewport, usable in any component's template with no import at all, including directly inside `v-for`
- **Module options forwarded through `runtimeConfig`** — `defaultThreshold`/`defaultRootMargin`/`defaultOnce` set once in `nuxt.config.ts` apply everywhere
- **A client-only plugin seeds those defaults** — reads the runtime config and calls `setViewportDefaults(...)` once, on the client, and registers `v-reveal` on the Vue app
- **Nothing needs `<ClientOnly>`** — the composables are SSR-safe on their own; this module's client-only-ness is only about *when* the defaults get applied

---

## When you'd reach for this

You're already on Nuxt and want the Vue composables wired up with zero manual setup — auto-imports, and one place to configure defaults instead of passing the same options at every call site.

- **Passing `threshold: 0.25` to every single `useElementVisibility()` call gets old** — Set `defaultThreshold`/`defaultRootMargin` once in `nuxt.config.ts` and every call that doesn't override them picks up your project's defaults automatically.
- **You'd rather not remember to import a composable in every component** — Auto-imports mean `useScroll()`/`useElementVisibility()`/etc. are just available, the same way Nuxt's own built-ins are.
- **A team member reaches for `<ClientOnly>` out of habit** — There's nothing to wrap. Every composable already renders a static SSR snapshot and picks up live state after hydration on its own.

---

## Installation

```bash
npm install @macrulez/inview-nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@macrulez/inview-nuxt'],
  inview: {
    defaultThreshold: 0.3,
    defaultRootMargin: '10px',
  },
})
```

Requires Nuxt `^3.9.0 || ^4.0.0`.

### Quick start

Once the module is registered, just use the composables — no imports:

```vue
<script setup>
const el = useTemplateRef('el')
const { isVisible, ratio } = useElementVisibility(el) // uses your configured defaultThreshold
</script>

<template>
  <div ref="el" :class="{ 'is-visible': isVisible }">...</div>
</template>
```

See
[`@macrulez/inview-vue`'s README](https://www.npmjs.com/package/@macrulez/inview-vue)
for the full composable API (options, return shapes, `useParallaxLayer`, etc).

### More examples

#### What the module does

1. **Auto-imports** every composable, utility, and core engine from `@macrulez/inview-vue` (`useScroll`, `useElementVisibility`, `useElementViewport`, `useParallaxLayer`, `useRevealController`, `usePrefersReducedMotion`, `useStagger`, `useScrollTo`, `useScrollSpy`, `mapRange`, `bindCSSVar`, `prefersReducedMotion`, `clamp`, `easings`, `staggerDelay`, `createScrollEngine`, `createVisibilityEngine`, `createElementTracker`, `createRevealController`, `createScrollSpy`, `scrollToElement`, `observerPool`, `ObserverPool`, `rafLoop`) — no explicit `import` needed in your components, and no separate `@macrulez/inview-core` dependency to reach the framework-agnostic layer.
2. **Forwards module options** (`defaultThreshold`, `defaultRootMargin`, `defaultOnce`) into `runtimeConfig.public.inview`.
3. **Registers a client-only plugin** (`runtime/plugin.client.ts`) that reads that runtime config and calls `setViewportDefaults(...)` — so every `useElementVisibility()`/`v-reveal`/`<InView>` use that doesn't pass its own options picks up your configured defaults — and registers `v-reveal` globally on the Vue app (`nuxtApp.vueApp.directive('reveal', vReveal)`), so it's usable in any component's template with no import.

#### Module options

| Option | Default | |
| --- | --- | --- |
| `defaultThreshold` | `0` | fallback for `threshold` |
| `defaultRootMargin` | `'0px'` | fallback for `rootMargin` |
| `defaultOnce` | `false` | fallback for `once` — applies to `useElementVisibility`, `v-reveal`, and `<InView>` alike |

#### Using `v-reveal` and `createRevealController`

```vue
<template>
  <div v-for="item in items" :key="item.id" v-reveal.once class="card">
    {{ item.title }}
  </div>
</template>
```

`v-reveal` needs no import — the module registers it globally. For a page-wide pass instead of a directive per element (e.g. from a client-only plugin of your own), `createRevealController` is auto-imported too:

```ts
// plugins/reveal.client.ts
export default defineNuxtPlugin(() => {
  createRevealController({ stagger: { step: 70, max: 4 } })
})
```

See [`@macrulez/inview-core`'s README](https://www.npmjs.com/package/@macrulez/inview-core) for `createRevealController`'s full option list, including the per-element `data-reveal-*` attribute overrides.

---

## Documentation & links

- 📖 **Full documentation:** [npm.vuecraft.ru/en/packages/inview](https://npm.vuecraft.ru/en/packages/inview/guide/nuxt-module.html)
- 🌐 **VueCraft:** [vuecraft.ru/en](https://vuecraft.ru/en)
- 👤 **Author:** [macrulez.ru/en](https://macrulez.ru/en)
- 💻 **GitHub:** [macrulezru/inview/packages/nuxt](https://github.com/macrulezru/inview/tree/master/packages/nuxt)
- 📦 **NPM:** [@macrulez/inview-nuxt](https://www.npmjs.com/package/@macrulez/inview-nuxt)
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
