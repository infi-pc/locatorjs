import { compact, getSlotCompoundVariant, memo, splitProps } from '../helpers.mjs';
import { createRecipe } from './create-recipe.mjs';

const tabsDefaultVariants = {
  "size": "md",
  "variant": "line"
}
const tabsCompoundVariants = []

const tabsSlotNames = [
  [
    "root",
    "tabs__root"
  ],
  [
    "list",
    "tabs__list"
  ],
  [
    "trigger",
    "tabs__trigger"
  ],
  [
    "content",
    "tabs__content"
  ],
  [
    "indicator",
    "tabs__indicator"
  ]
]
const tabsSlotFns = /* @__PURE__ */ tabsSlotNames.map(([slotName, slotKey]) => [slotName, createRecipe(slotKey, tabsDefaultVariants, getSlotCompoundVariant(tabsCompoundVariants, slotName))])

const tabsFn = memo((props = {}) => {
  return Object.fromEntries(tabsSlotFns.map(([slotName, slotFn]) => [slotName, slotFn.recipeFn(props)]))
})

const tabsVariantKeys = [
  "size",
  "variant",
  "fitted"
]
const getVariantProps = (variants) => ({ ...tabsDefaultVariants, ...compact(variants) })

export const tabs = /* @__PURE__ */ Object.assign(tabsFn, {
  __recipe__: false,
  __name__: 'tabs',
  raw: (props) => props,
  classNameMap: {},
  variantKeys: tabsVariantKeys,
  variantMap: {
  "size": [
    "xs",
    "sm",
    "md",
    "lg"
  ],
  "variant": [
    "line",
    "subtle",
    "connected",
    "enclosed"
  ],
  "fitted": [
    "true"
  ]
},
  splitVariantProps(props) {
    return splitProps(props, tabsVariantKeys)
  },
  getVariantProps
})