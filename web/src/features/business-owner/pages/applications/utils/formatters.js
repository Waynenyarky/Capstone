import dayjs from 'dayjs'

export function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  return dayjs(dateStr).format('MMM D, YYYY')
}

export function formatCurrency(value) {
  if (!value && value !== 0) return '₱0.00'
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value)
}
