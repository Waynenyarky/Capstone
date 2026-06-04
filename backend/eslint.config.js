import js from '@eslint/js'
import globals from 'globals'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import unusedImports from 'eslint-plugin-unused-imports'

export default [
  {
    ignores: ['jest.setup.js', '__tests__/integration/error-scenarios.test.js', 'eslint.config.js'],
  },
  js.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.js'],
    plugins: {
      prettier: prettier,
      'unused-imports': unusedImports,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'no-unused-vars': 'warn', // Warn but don't block on unused vars in existing code
      'unused-imports/no-unused-imports': 'error', // Always remove unused imports
      'unused-imports/no-unused-vars': 'off', // Disabled to avoid conflicts with no-unused-vars
      'no-use-before-define': 'off', // Common pattern in Node.js to define helpers after usage
      'no-console': 'off', // Allow console in backend
      'no-empty': 'off', // Allow empty catch blocks
      'no-case-declarations': 'off', // Allow declarations in case blocks
      'no-dupe-keys': 'off', // Allow duplicate keys (used in some analytics mock data)
      'no-useless-escape': 'off', // Allow escapes in regex patterns (common in validation)
      'no-undef': 'off', // Dynamically loaded Mongoose models in errorTracking.js
      'prettier/prettier': 'error',
    },
  },
]
