// @ts-check
import antfu from '@antfu/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Your custom configs here
  antfu(
    {},
    {
      rules: {
        'no-console': 'warn',
      // 'node/prefer-global/process': 'off',
      },
    },
    {
      files: ['server/**/*.ts', 'worker/**/*.ts', 'nuxt.config.ts', 'scripts/**/*', 'db/**/*.js'],
      rules: {
        'node/prefer-global/process': 'off',
      },
    },
    {
      files: ['scripts/**/*'],
      rules: {
        'no-console': 'off',
      },
    },
  ),
)
