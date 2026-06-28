export const STATUS_CONFIG = {
  submitted: { color: 'blue', label: 'Pending Review' },
  under_review: { color: 'gold', label: 'Under Review' },
  resubmit: { color: 'cyan', label: 'Resubmitted' },
  approved: { color: 'green', label: 'Approved' },
  rejected: { color: 'red', label: 'Rejected' },
  returned: { color: 'volcano', label: 'Returned' },
  needs_revision: { color: 'volcano', label: 'Needs Revision' },
  appeal_pending: { color: 'purple', label: 'Appeal Pending' },
  appeal_rejected: { color: 'red', label: 'Appeal Rejected' },
  draft: { color: 'default', label: 'Draft' },
}

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Pending Review' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'resubmit', label: 'Resubmitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'returned', label: 'Returned' },
  { value: 'appeal_pending', label: 'Appeal Pending' },
  { value: 'appeal_rejected', label: 'Appeal Rejected' },
]
