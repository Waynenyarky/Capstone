export const PROVIDER_STATUS = Object.freeze({
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETION_PENDING: 'deletion_pending',
  DELETED: 'deleted',
  REJECTED: 'rejected',
})

export const PROVIDER_STATUS_OPTIONS = [
  { value: PROVIDER_STATUS.PENDING, label: 'Pending' },
  // Account status labels
  { value: PROVIDER_STATUS.ACTIVE, label: 'Active' },
  { value: PROVIDER_STATUS.INACTIVE, label: 'Inactive' },
  { value: PROVIDER_STATUS.DELETION_PENDING, label: 'Deletion Requested' },
  { value: PROVIDER_STATUS.REJECTED, label: 'Rejected' },
  { value: PROVIDER_STATUS.DELETED, label: 'Deleted' },
]

export function getProviderStatusLabel(value) {
  const found = PROVIDER_STATUS_OPTIONS.find((opt) => opt.value === value)
  return found?.label || value
}