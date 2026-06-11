import { formatDate } from '../utils/formatters.js'

export const RETIREMENT_ALERT_CONFIG = {
  requested: {
    type: 'warning',
    title: 'Retirement Requested',
    description: (business) => {
      const retirementReason = business?.retirementApplicationLetter || business?.retirementReason
      return `Submitted ${formatDate(business?.retirementRequestedAt)}. Waiting for inspector verification.${retirementReason ? ` Reason: ${retirementReason}` : ''}`
    },
  },
  inspector_verified: {
    type: 'info',
    title: 'Retirement Verified by Inspector',
    description: 'Your retirement request has been inspector-verified and is awaiting LGU officer confirmation.',
  },
  pending_tax_payment: {
    type: 'warning',
    title: 'Cessation Tax Assessed',
    description: 'A cessation tax has been assessed for your business. Please complete the payment in the Payments & Fees section below to proceed with closure.',
  },
  confirmed: {
    type: 'success',
    title: 'Retirement Confirmed',
    description: (business) => `Confirmed ${formatDate(business?.retirementConfirmedAt)}. Business status is now closed.`,
  },
  rejected: {
    type: 'error',
    title: 'Retirement Request Rejected',
    description: (business) => business?.retirementRejectionReason || 'Please review remarks and contact LGU support if needed.',
  },
}
