/**
 * Generate mock receipt data for application payment
 */
export function generateApplicationPaymentReceipt(business) {
  const submittedDate = business.submittedAt ? new Date(business.submittedAt) : new Date()
  const receiptId = `APP-${business.applicationReferenceNumber || 'N/A'}-${submittedDate.getTime().toString().slice(-6)}`
  
  return {
    receiptId,
    transactionDate: submittedDate.toLocaleString(),
    transactionName: 'Application Processing Fee',
    fees: [{ label: 'Application Processing Fee', amount: 500 }],
    totalAmount: 500,
    applicationReferenceNumber: business.applicationReferenceNumber || 'N/A',
  }
}

/**
 * Generate mock receipt data for appeal payment
 */
export function generateAppealPaymentReceipt(business) {
  const submittedDate = business.submittedAt ? new Date(business.submittedAt) : new Date()
  const receiptId = `APPEAL-${business.applicationReferenceNumber || 'N/A'}-${submittedDate.getTime().toString().slice(-6)}`
  
  return {
    receiptId,
    transactionDate: submittedDate.toLocaleString(),
    transactionName: 'Appeal Processing Fee',
    fees: [{ label: 'Appeal Processing Fee', amount: 500 }],
    totalAmount: 500,
    applicationReferenceNumber: business.applicationReferenceNumber || 'N/A',
  }
}
