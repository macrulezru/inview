# Changelog

All notable changes to the `@macrulez/inview-*` packages are documented here. The whole
monorepo versions in lockstep — every package bumps together, even releases that only touch
one of them — so there's one changelog, not one per package.

Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.3.0] - 2026-09-26

Development plan: [docs/0.3.0.md](docs/0.3.0.md).

### Added

- **Core**
  - `createRevealController`'s stagger delay now skips itself entirely under
    `prefers-reduced-motion: reduce` (the class/attribute toggle still happens normally — only
    the staggered *timing* is skipped).
  - `createElementTracker`, and the `useElementViewport`/`useParallaxLayer` composables/hooks
    built on it, accept `root` to measure `viewportProgress`/`distanceFromCenter` against a
    scrollable container instead of the window.
  - `VisibilityEngine.observe()` now returns a `VisibilityHandle` — still callable as a plain
    unsubscribe function, but with an added `.update({ once, onEnter, onLeave })` that changes
    those live, without tearing down the pooled `IntersectionObserver` subscription.
    `root`/`rootMargin`/`threshold` still require a real re-subscribe (pool membership is keyed
    on them).
  - `createScrollSpy` — tracks which of a list of targets sits in an "active" band near the
    viewport's vertical center, for nav-highlight/scrollspy UIs.
  - `scrollToElement` — smooth-scrolls a target (default `window`) so an element lands at its
    edge, with a px `offset`.
  - `createRevealController`'s returned controller gained `observe(el)`/`unobserve(el)` (for
    elements outside the `selector` scan) and `refresh(selector?)` (a one-off scan with a
    different selector). Per-element `data-reveal-attribute` overrides `activeAttribute`, the
    one option that was missing a per-element override `activeClass` already had via
    `data-reveal-class`.
- **Vue**
  - `useElementVisibility`'s `threshold`/`rootMargin`/`root`/`once` now accept
    `MaybeRefOrGetter` — `threshold`/`rootMargin`/`root` changing triggers a real re-subscribe,
    `once` updates live via the new `VisibilityHandle.update()`. `onEnter`/`onLeave` stay plain
    values (see "Notes" below for why).
  - `useRevealController` — creates a `createRevealController` `onMounted`, destroys it
    `onUnmounted`.
  - `usePrefersReducedMotion` — a reactive `Ref<boolean>`, unlike the static
    `prefersReducedMotion()` utility.
  - `useStagger`, `useScrollTo`, `useScrollSpy` — reactive wrappers around `staggerDelay`,
    `scrollToElement`, and `createScrollSpy` respectively.
- **React**
  - `useElementVisibility`'s `once`/`onEnter`/`onLeave` now update live across re-renders
    (previously frozen at the first render that created the subscription — a real stale-closure
    bug, not just a missed optimization). `threshold` is normalized into a stable key so a fresh
    inline `[0, 0.5]` array literal every render doesn't force a re-subscribe on every render.
  - `useReveal` — React's equivalent of the Vue adapter's `v-reveal`: wraps
    `useElementVisibility` and toggles a class/attribute on the target automatically.
  - `useRevealController`, `usePrefersReducedMotion`, `useStagger`, `useScrollTo`,
    `useScrollSpy` — same shape as the Vue versions above.
- **Nuxt**
  - `useRevealController`, `usePrefersReducedMotion`, `useStagger`, `useScrollTo`,
    `useScrollSpy`, `createScrollSpy`, `scrollToElement` added to the module's auto-import list.

### Notes

- `onEnter`/`onLeave` were deliberately **not** made reactive-wrappable in Vue, unlike `once`.
  Vue's `toValue()` treats any function as a getter and calls it to unwrap — wrapping a
  callback option in `MaybeRefOrGetter<Fn>` would make Vue invoke the callback itself trying to
  "unwrap" it. Vue composables also run once in `setup()`, so a callback closing over a `ref`'s
  `.value` already reads it fresh every time — there's no actual staleness to fix there, unlike
  React's per-render-closure model.
- `useProgressBar` (a reading-progress bar) wasn't added as its own hook — `useScroll().progress`
  already is the value; see the README recipe in each adapter instead.

## [0.2.3] - 2026-09-24

- Nuxt module: register `<InView>` as a global component, auto-import
  `setViewportDefaults`/`viewportDefaults` (previously the one inconsistency in an otherwise
  fully auto-imported composable surface).

## [0.2.1] - 2026-09-11

- `createRevealController`'s `stagger` option gained `cssVar` (pass `null` to skip writing the
  CSS var) and `applyInlineDelay` (an inline `transition-delay` that wins the cascade over a
  consumer's own `transition` shorthand, e.g. a hover-transition declared later).
- `staggerDelay` gained `mode: 'cycle'`, wrapping back to 0 past `max` for a repeating wave
  instead of flattening.
- React: `<InviewProvider>`/`useInviewDefaults()` (app-level defaults) and `<InView>` (a
  render-prop component) added, mirroring the Vue adapter.
- `ObserverPool.stats()` — debug-only introspection into how many native
  `IntersectionObserver` instances are pooled and how many elements sit on each.
- `v-reveal` (Vue) shallow-compares its binding value on `updated` instead of only checking
  reference equality.

## [0.2.0] - 2026-09-11

- `createRevealController` — scans the DOM for a selector and toggles a class/attribute on
  each match as it enters the viewport, picking up elements added later via `MutationObserver`.
  Built-in stagger delay via `staggerDelay`.
- `<InView>` (Vue) — a renderless wrapper around `useElementVisibility` exposing
  `isVisible`/`ratio` via a scoped slot.
- Package scope renamed to `@macrulez/*`; `publishConfig` added for public npm publishing.

## [0.1.0] - 2026-09-10

Initial release: core engine (`createScrollEngine`, `createVisibilityEngine`,
`createElementTracker`, `ObserverPool`, `rafLoop`), the Vue adapter (`useScroll`,
`useElementVisibility`, `useElementViewport`, `useParallaxLayer`, `v-reveal`,
`setViewportDefaults`), and the Nuxt module wrapping it.
