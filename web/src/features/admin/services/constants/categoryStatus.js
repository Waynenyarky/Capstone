export const CATEGORY_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
})

export const CATEGORY_STATUS_OPTIONS = [
  { value: CATEGORY_STATUS.ACTIVE, label: 'Active' },
  { value: CATEGORY_STATUS.INACTIVE, label: 'Inactive' },
]

export function getCategoryStatusLabel(value) {
  const found = CATEGORY_STATUS_OPTIONS.find((opt) => opt.value === value)
  return found?.label || value
}