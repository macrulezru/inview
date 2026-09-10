/**
 * Writes a numeric progress value into a CSS custom property on `el`,
 * so the resulting visual effect can be composed in plain CSS.
 */
export function bindCSSVar(el: HTMLElement, name: string, value: number | string): void {
  const varName = name.startsWith('--') ? name : `--${name}`
  el.style.setProperty(varName, String(value))
}
