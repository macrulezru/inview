import { defineComponent, h, ref, type PropType } from 'vue'
import { useElementVisibility } from './useElementVisibility'

/**
 * Renderless wrapper around useElementVisibility for the cases where a
 * `v-for` item needs the reactive `isVisible`/`ratio` value back in the
 * template (e.g. to lazily mount a heavy child), not just a class toggle —
 * `v-reveal` covers the class-toggle case without the extra component.
 *
 * Always renders one real wrapping element (`as`, default `div`) since an
 * IntersectionObserver needs an actual element to measure — "renderless"
 * here means no imposed styling/behavior beyond that, not zero DOM.
 *
 * ```vue
 * <InView v-for="item in items" :key="item.id" once @enter="onEnter">
 *   <template #default="{ isVisible }">
 *     <Heavy v-if="isVisible" :item="item" />
 *   </template>
 * </InView>
 * ```
 */
export const InView = defineComponent({
  name: 'InView',
  props: {
    once: { type: Boolean, default: undefined },
    threshold: { type: [Number, Array] as PropType<number | number[]>, default: undefined },
    rootMargin: { type: String, default: undefined },
    root: { type: Object as PropType<HTMLElement | null>, default: undefined },
    /** tag for the measured wrapper element. default 'div' */
    as: { type: String, default: 'div' },
  },
  emits: ['enter', 'leave'],
  setup(props, { slots, emit }) {
    const el = ref<HTMLElement | null>(null)
    const { isVisible, ratio } = useElementVisibility(el, {
      once: props.once,
      threshold: props.threshold,
      rootMargin: props.rootMargin,
      root: props.root,
      onEnter: (info) => emit('enter', info),
      onLeave: (info) => emit('leave', info),
    })

    return () => h(props.as, { ref: el }, slots.default?.({ isVisible: isVisible.value, ratio: ratio.value }))
  },
})
