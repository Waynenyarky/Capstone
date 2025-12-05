export const categoryNameRules = [
  { required: true, whitespace: true, message: 'Please input a name' },
  { type: 'string', min: 2, max: 50, message: 'Must be between 2 and 50 characters' },
  {
    pattern: /^[A-Za-z0-9][A-Za-z0-9\s-]*$/,
    message: 'Use letters, numbers, spaces, and hyphens only',
  },
]

export const categoryDescriptionRules = [
  { required: true, whitespace: true, message: 'Please input a description' },
  { type: 'string', min: 2, max: 200, message: 'Must be between 2 and 200 characters' },
]

export const categoryIconRules = [
  { required: true, message: 'Please select a icon' },
]

export const categoryStatusRules = [
  { required: true, message: 'Please select a status' },
]