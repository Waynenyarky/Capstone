export const SERVICE_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
})

export const SERVICE_STATUS_OPTIONS = [
  { value: SERVICE_STATUS.ACTIVE, label: 'Active' },
  { value: SERVICE_STATUS.INACTIVE, label: 'Inactive' },
  { value: SERVICE_STATUS.DRAFT, label: 'Draft' },
]

export function getServiceStatusLabel(value) {
  const found = SERVICE_STATUS_OPTIONS.find((opt) => opt.value === value)
  return found?.label || value
}