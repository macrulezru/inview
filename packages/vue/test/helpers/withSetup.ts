import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

/** Runs a composable inside a mounted component so lifecycle hooks work. */
export function withSetup<T>(composable: () => T) {
  let result!: T
  const wrapper = mount(
    defineComponent({
      setup() {
        result = composable()
        return () => h('div')
      },
    })
  )
  return { result, wrapper }
}
