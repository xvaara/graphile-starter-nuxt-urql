// @ts-check
import antfu from '@antfu/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Your custom configs here
  antfu({}, {
    rules: {
      'no-console': 'warn',
    },
  }),
)
