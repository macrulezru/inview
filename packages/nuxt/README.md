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

- **Auto-imports every composable and utility** — `useScroll`, `useElementVisibility`, `useElementViewport`, `useParallaxLayer`, `mapRange`, `bindCSSVar`, `prefersReducedMotion`, `easings` — no explicit `import` anywhere in your app
- **Module options forwarded through `runtimeConfig`** — `defaultThreshold`/`defaultRootMargin` set once in `nuxt.config.ts` apply everywhere
- **A client-only plugin seeds those defaults** — reads the runtime config and calls `setViewportDefaults(...)` once, on the client
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

1. **Auto-imports** every composable and utility from `@macrulez/inview-vue` (`useScroll`, `useElementVisibility`, `useElementViewport`, `useParallaxLayer`, `mapRange`, `bindCSSVar`, `prefersReducedMotion`, `easings`) — no explicit `import` needed in your components.
2. **Forwards module options** (`defaultThreshold`, `defaultRootMargin`) into `runtimeConfig.public.inview`.
3. **Registers a client-only plugin** (`runtime/plugin.client.ts`) that reads that runtime config and calls `setViewportDefaults(...)` — so every `useElementVisibility()` call that doesn't pass its own `threshold`/`rootMargin` picks up your configured defaults.

#### Module options

| Option | Default | |
| --- | --- | --- |
| `defaultThreshold` | `0` | fallback for `useElementVisibility`'s `threshold` |
| `defaultRootMargin` | `'0px'` | fallback for `useElementVisibility`'s `rootMargin` |

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
