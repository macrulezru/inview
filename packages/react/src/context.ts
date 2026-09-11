import { createContext, createElement, useContext, type ReactNode } from 'react'

export interface ViewportDefaults {
  threshold: number | number[]
  rootMargin: string
  once: boolean
}

const defaultViewportDefaults: ViewportDefaults = {
  threshold: 0,
  rootMargin: '0px',
  once: false,
}

const InviewContext = createContext<ViewportDefaults | null>(null)

export interface InviewProviderProps {
  /** overrides applied on top of the package-wide defaults (threshold: 0, rootMargin: '0px', once: false) */
  defaults?: Partial<ViewportDefaults>
  children: ReactNode
}

/**
 * App-level defaults for `useElementVisibility` (and `<InView>`, which reads
 * the same context) — the React equivalent of the Vue adapter's
 * `setViewportDefaults()`, so threshold/rootMargin/once don't have to be
 * repeated at every call site across an app.
 *
 * Options passed directly to a `useElementVisibility()` call always win over
 * whatever `<InviewProvider>` supplies.
 */
export function InviewProvider(props: InviewProviderProps) {
  const merged: ViewportDefaults = { ...defaultViewportDefaults, ...props.defaults }
  return createElement(InviewContext.Provider, { value: merged }, props.children)
}

/**
 * Reads the current `<InviewProvider>` defaults, falling back to the
 * package-wide defaults (threshold: 0, rootMargin: '0px', once: false) when
 * called outside a provider — so existing code without a provider keeps its
 * current behavior unchanged.
 */
export function useInviewDefaults(): ViewportDefaults {
  return useContext(InviewContext) ?? defaultViewportDefaults
}
