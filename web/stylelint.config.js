export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'declaration-block-no-shorthand-property-overrides': true,
    'no-descending-specificity': null,
    'selector-class-pattern': null,
    'custom-property-pattern': null,
  },
  ignores: ['dist', 'coverage', 'node_modules', '**/*.{js,jsx,ts,tsx}'],
}
