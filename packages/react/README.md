# **Inview React**

![Inview React](https://github.com/macrulezru/assets/blob/master/packages-images/inview-react-vuecraft.png?raw=true)

React hooks for scroll, visibility, and viewport-position tracking,
mirroring
[`@macrulez/inview-vue`](https://www.npmjs.com/package/@macrulez/inview-vue)'s
API 1:1 (`Ref<T>` → `T`, no `.value`). Built on
[`@macrulez/inview-core`](https://www.npmjs.com/package/@macrulez/inview-core)
via `useSyncExternalStore`. SSR-safe: returns a static snapshot on the
server and subscribes only on the client.

Part of the [inview](https://github.com/macrulezru/inview) monorepo.

---

## Features

- **`useScroll()`** — reactive scroll state (position, direction, progress, velocity, `isScrolling`) for the window or a scrollable element
- **`useElementVisibility()`** — `IntersectionObserver`-backed visibility, with enter/leave edge detection and a `once` mode; elements sharing the same options reuse a single observer
- **`useElementViewport()`** — an element's rect, `viewportProgress` (0..1 through the viewport, or a scroll container via `root`), and distance from its center
- **`useParallaxLayer()`** — a ready-made "layer with its own scroll speed" primitive built on `useElementViewport`, disabling itself automatically under `prefers-reduced-motion`
- **`<InviewProvider>` / `useInviewDefaults()`** — app-level `threshold`/`rootMargin`/`once` defaults for `useElementVisibility` and `<InView>`, the React equivalent of the Vue adapter's `setViewportDefaults()`, so you don't repeat the same options at every call site
- **`<InView>` render-prop component** — same idea as `useElementVisibility`, but as a component for when the element you're measuring is the one being conditionally rendered, not one you already have a ref to
- **`useReveal()`** — React's equivalent of the Vue adapter's `v-reveal`: wraps `useElementVisibility` and also toggles a class/attribute on the target as it enters the viewport, without hand-rolling `classList.toggle` in an effect
- **`useRevealController()`** — lifecycle wrapper around `createRevealController`: creates it in an effect, destroys it automatically on unmount
- **`usePrefersReducedMotion()`** — reactive `prefers-reduced-motion: reduce`, unlike `@macrulez/inview-core`'s static `prefersReducedMotion()` check
- **`useStagger()`, `useScrollTo()`, `useScrollSpy()`** — reactive `staggerDelay`, scroll-to-element-with-offset, and nav-highlight/scrollspy, respectively
- **The full `@macrulez/inview-core` surface, re-exported** — `createRevealController`, `createScrollEngine`, `createVisibilityEngine`, `ObserverPool`, `staggerDelay`, and the rest are all available straight from `@macrulez/inview-react` too, no separate core install needed — useful for `createRevealController` in particular, since a page-wide DOM scan isn't really per-component state a hook would model well
- **Same API as the Vue adapter, same behavior** — built on `useSyncExternalStore`, so it plays correctly with concurrent rendering
- **SSR-safe by design** — a static snapshot on the server, a real subscription only once mounted on the client

---

## When you'd reach for this

The same four capabilities as the Vue composables, for a React codebase — the same core engines underneath, just without the Vue dependency.

- **A React app needs the same scroll-driven UI a Vue app already has** — a design system or a project mid-migration where the tracking logic should behave identically regardless of which framework a given screen is written in.
- **A progress bar or scroll-driven header needs live scroll state** — `useScroll()` gives you `x`/`y`/`direction`/`progress`, updating on their own, without a manual event listener or cleanup effect to write.
- **A card should fade in once, the first time it's seen** — `useElementVisibility(el, { once: true })` stops observing automatically the moment it fires.
- **A hero section needs a background that moves slower than the foreground** — `useParallaxLayer()` turns scroll position into a ready inline `style`, at whatever relative `speed` you pick per layer.

---

## Installation

Requires React `^18.0.0 || ^19.0.0`.

```bash
npm install @macrulez/inview-react
```

### A note on `target` props

Unlike the Vue adapter (which accepts a `Ref`), every hook here takes a plain `HTMLElement | null` value. Use a state-backed callback ref so the hook re-runs when the element actually mounts, instead of a plain `useRef` (which doesn't trigger a re-render when `.current` changes):

```tsx
const [el, setEl] = useState<HTMLElement | null>(null)
const { isVisible } = useElementVisibility(el)

return <div ref={setEl}>...</div>
```

### Quick start

```tsx
import { useScroll } from '@macrulez/inview-react'

function ScrollHud() {
  const { y, direction, progress, velocity, isScrolling, scrollTo } = useScroll()
  return <div>{progress.toFixed(2)}</div>
}
```

`target` defaults to `window`. `options.idleTimeout` controls how long (ms) after the last scroll event `isScrolling` stays `true` (default 150).

### More examples

#### `useElementVisibility(target, options?)`

```tsx
import { useState } from 'react'
import { useElementVisibility } from '@macrulez/inview-react'

function RevealBox() {
  const [el, setEl] = useState<HTMLElement | null>(null)
  const { isVisible, ratio } = useElementVisibility(el, {
    threshold: 0.3,
    once: true,
    onEnter: (info) => console.log(info.edge),
  })
  return (
    <div ref={setEl} className={isVisible ? 'is-visible' : ''}>
      ...
    </div>
  )
}
```

Elements sharing the same `threshold`/`rootMargin`/`root` reuse a single `IntersectionObserver` under the hood.

| Option | Default | |
| --- | --- | --- |
| `threshold` | `0` | number or number[] — changing it across renders re-subscribes |
| `rootMargin` | `'0px'` | changing it across renders re-subscribes |
| `root` | viewport | `HTMLElement \| null` — changing it across renders re-subscribes |
| `once` | `false` | updates **live** across renders, without re-subscribing |
| `onEnter` / `onLeave` | — | called with `{ isIntersecting, intersectionRatio, boundingClientRect, edge }`; a new function every render is picked up **live** too, without re-subscribing |

`threshold`/`rootMargin`/`once` fall back to `<InviewProvider>`'s defaults when the hook is rendered inside one (see below), and to `0`/`'0px'`/`false` otherwise — the same as the Vue adapter's `viewportDefaults`, just read from React context instead of a module-level object. Options passed directly to the hook always win over the provider.

`threshold`/`rootMargin`/`root` determine which pooled `IntersectionObserver` this subscribes to, so changing any of them between renders is a real unsubscribe-and-resubscribe — there's no way around that with a pooled observer (a fresh `[0, 0.5]` array literal every render is still recognized as unchanged, though — only an actual value change re-subscribes). `once`/`onEnter`/`onLeave` aren't part of that pool key, so they're synced into the existing subscription on every render instead — passing a new inline `onEnter` each render (the normal case in React) is picked up immediately rather than silently running whatever closure happened to be captured the first time the element was observed.

#### `<InviewProvider>` / `useInviewDefaults()`

App-level fallback for `threshold`/`rootMargin`/`once`, read by `useElementVisibility` and `<InView>` alike:

```tsx
import { InviewProvider } from '@macrulez/inview-react'

function App() {
  return (
    <InviewProvider defaults={{ threshold: 0.2, once: true }}>
      <Page />
    </InviewProvider>
  )
}
```

Any `useElementVisibility(el, { threshold: 0.6 })` call inside `<Page>` still gets `threshold: 0.6` — explicit options always take priority over the provider. `useInviewDefaults()` reads the same value directly, for a custom component that wants the resolved defaults without going through `useElementVisibility`.

#### `<InView>`

Render-prop wrapper around `useElementVisibility` for when the element being measured is the one whose render depends on the result — e.g. lazily mounting a heavy child once it's visible — where a `useState`-backed callback ref would just be extra boilerplate around the same thing:

```tsx
import { InView } from '@macrulez/inview-react'

<InView once>{({ isVisible }) => (isVisible ? <Heavy /> : null)}</InView>
```

Always renders one real wrapping element (`as`, default `'div'`) since an `IntersectionObserver` needs an actual element to measure. Accepts the same `once`/`threshold`/`rootMargin`/`root`/`onEnter`/`onLeave` options as `useElementVisibility`, plus `as` for the wrapper tag.

#### `useReveal(target, options?)`

React's equivalent of the Vue adapter's `v-reveal` directive — same `useElementVisibility` underneath, plus toggling a class (default `"in"`) and/or a data-attribute on `target` automatically, so the common "just flip a class on enter" case doesn't need its own effect:

```tsx
import { useState } from 'react'
import { useReveal } from '@macrulez/inview-react'

function RevealCard() {
  const [el, setEl] = useState<HTMLElement | null>(null)
  const { isVisible } = useReveal(el, { once: true })
  return <div ref={setEl}>...</div> // gets/loses class "in" as it enters the viewport
}
```

| Option | Default | |
| --- | --- | --- |
| `activeClass` | `'in'` | pass `null` to disable the class toggle |
| `activeAttribute` | — | boolean data-attribute set alongside `activeClass` |
| `once` / `threshold` / `rootMargin` / `root` / `onEnter` / `onLeave` | same as `useElementVisibility` | |

For a page-wide "every `.reveal`/`[data-reveal]` element, including ones that don't exist yet" pass instead of a hook per element, see `createRevealController`/`useRevealController` below.

#### `useRevealController(options?)`

Lifecycle wrapper around `createRevealController` — creates it in an effect and destroys it automatically on unmount, so a page-wide reveal pass doesn't need its own manual `useEffect`:

```tsx
import { useRevealController } from '@macrulez/inview-react'

function App() {
  useRevealController({ stagger: { step: 70, max: 4 } })
  return <div className="reveal">...</div>
}
```

Returns `{ refresh(selector?), observe(el), unobserve(el), destroy() }`, same as `createRevealController` itself. `options` are captured once, at mount — they don't react to a changing options object on re-render, the same one-shot model `createRevealController` has on its own.

#### `usePrefersReducedMotion()`

Reactive `prefers-reduced-motion: reduce`, unlike `@macrulez/inview-core`'s static `prefersReducedMotion()` (a one-shot `matchMedia().matches` read that won't notice the OS setting changing mid-session unless something else happens to re-invoke it):

```tsx
import { usePrefersReducedMotion } from '@macrulez/inview-react'

const prefersReducedMotion = usePrefersReducedMotion() // boolean, updates live
```

#### `useStagger(index, options?)`

Thin wrapper around `staggerDelay`, for parity with the Vue adapter's `useStagger` — the computation itself is cheap enough that it's just called directly every render, no `useMemo` needed:

```tsx
import { useStagger } from '@macrulez/inview-react'

const delay = useStagger(index, { step: 70, max: 4 }) // string, e.g. '140ms'
```

#### `useScrollTo(target?)`

Returns a `scrollTo(el, options?)` callback that smooth-scrolls `target` (default `window`) so `el` lands at its edge — the "scroll to an element, with an offset" case `useScroll()`'s own `scrollTo` doesn't cover (that one only takes a raw `x`/`y` position):

```tsx
import { useScrollTo } from '@macrulez/inview-react'

const scrollTo = useScrollTo()
scrollTo(sectionEl, { offset: 80 }) // e.g. clearing a sticky header
```

#### `useScrollSpy(targets, options?)`

Tracks which of `targets` currently sits in the "active" band (see `createScrollSpy` in the core README) and returns its index — the nav-highlight case, built entirely on the pooled visibility engine:

```tsx
import { useState } from 'react'
import { useScrollSpy } from '@macrulez/inview-react'

function Nav() {
  const [sections] = useState<(HTMLElement | null)[]>(() => [])
  const activeIndex = useScrollSpy(sections)
  return sections.map((_, i) => <a key={i} className={activeIndex === i ? 'active' : ''} />)
}
```

`targets` must be a stable array (as from `useState` above) — a new array literal every render forces a real re-subscribe, the same as `target`/`root` elsewhere in this package.

#### A reading-progress bar, from `useScroll()`

Not its own hook — `useScroll().progress` (0..1) already is the value, so a progress bar is just:

```tsx
function ProgressBar() {
  const { progress } = useScroll()
  return <div className="progress-bar" style={{ transform: `scaleX(${progress})` }} />
}
```

#### `useElementViewport(target, options?)`

```ts
const { rect, viewportProgress, distanceFromCenter } = useElementViewport(el)
```

`viewportProgress` (0..1) goes from 0 when the element enters at the tracking frame's bottom edge to 1 when it leaves at the top edge — the value parallax effects are built on. That frame is the window by default; pass `root` to measure against a scrollable container instead, for an element inside `overflow: auto` (a dashboard panel, a modal):

```ts
const { viewportProgress } = useElementViewport(el, { root: scrollContainer })
```

`rect` stays the element's plain, window-relative `getBoundingClientRect()` regardless of `root`.

#### `useParallaxLayer(target, options)`

```tsx
function Parallax() {
  const [stage, setStage] = useState<HTMLElement | null>(null)
  const back = useParallaxLayer(stage, { speed: 0.2 })
  const front = useParallaxLayer(stage, { speed: 1 })

  return (
    <div ref={setStage} className="stage">
      <div className="layer" style={back.style}>
        back
      </div>
      <div className="layer" style={front.style}>
        front
      </div>
    </div>
  )
}
```

| Option | Default | |
| --- | --- | --- |
| `speed` | required | `1` moves with scroll, `>1` faster, `<1` slower, negative reverses direction |
| `axis` | `'y'` | `'x' \| 'y'` |
| `range` | `100` | px offset amplitude at `speed: 1` |
| `clamp` | `false` | clamp the offset at the 0/1 progress edges instead of extrapolating |
| `easing` | — | applied to `viewportProgress` before mapping it to an offset — see `easings` |
| `root` | window | measure `viewportProgress` against this scroll container instead of the window, same as `useElementViewport`'s own `root` |

Automatically disables itself (`style.transform = 'none'`) under `prefers-reduced-motion: reduce`.

#### Low-level utilities and engines

Every [`@macrulez/inview-core`](https://www.npmjs.com/package/@macrulez/inview-core) export is re-exported here — `createScrollEngine`, `createVisibilityEngine`, `createElementTracker`, `createRevealController`, `createScrollSpy`, `scrollToElement`, `ObserverPool`/`observerPool`, `rafLoop`, `mapRange`, `bindCSSVar`, `prefersReducedMotion`, `clamp`, `staggerDelay`, `easings`, and their types.

```tsx
import { createRevealController } from '@macrulez/inview-react'

useEffect(() => {
  const controller = createRevealController({ stagger: { step: 70, max: 4 } })
  return () => controller.destroy()
}, [])
```

`createRevealController` scans the DOM for `.reveal`/`[data-reveal]` elements (configurable) and toggles a class as each enters the viewport, including ones added later — a page-wide pass rather than per-component state, so it's a plain function call in an effect rather than its own hook. See
[`@macrulez/inview-core`'s README](https://www.npmjs.com/package/@macrulez/inview-core) for its full option list, including per-element `data-reveal-*` overrides.

---

## Documentation & links

- 📖 **Full documentation:** [npm.vuecraft.ru/en/packages/inview](https://npm.vuecraft.ru/en/packages/inview/guide/react-hooks.html)
- 🌐 **VueCraft:** [vuecraft.ru/en](https://vuecraft.ru/en)
- 👤 **Author:** [macrulez.ru/en](https://macrulez.ru/en)
- 💻 **GitHub:** [macrulezru/inview/packages/react](https://github.com/macrulezru/inview/tree/master/packages/react)
- 📦 **NPM:** [@macrulez/inview-react](https://www.npmjs.com/package/@macrulez/inview-react)
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
