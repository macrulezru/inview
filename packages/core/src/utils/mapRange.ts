import { clamp } from './clamp'

/**
 * Linearly maps `value` from the `from` range into the `to` range.
 * Pass `clampResult: true` to keep the result within `to` at the edges.
 */
export function mapRange(
  value: number,
  from: [number, number],
  to: [number, number],
  clampResult = false
): number {
  const [inMin, inMax] = from
  const [outMin, outMax] = to
  const ratio = inMax === inMin ? 0 : (value - inMin) / (inMax - inMin)
  const result = outMin + ratio * (outMax - outMin)
  if (!clampResult) return result
  return clamp(result, Math.min(outMin, outMax), Math.max(outMin, outMax))
}
