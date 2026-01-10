import dayjs from 'dayjs'

const pendingBills = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    type: 'Permit Fee',
    description: "Mayor's Permit Renewal Fee",
    amount: 5000.00,
    dueDate: dayjs().add(9, 'day').format('YYYY-MM-DD'),
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    type: 'Inspection Fee',
    description: "Annual Fire Safety Inspection",
    amount: 500.00,
    dueDate: dayjs().add(15, 'day').format('YYYY-MM-DD'),
  }
]

let history = [
  {
    id: '101',
    invoiceNumber: 'INV-2023-999',
    type: 'Fine',
    amount: 1000.00,
    method: 'Gcash',
    date: '2023-12-15',
    status: 'Paid',
    transactionId: 'GC-999888777',
    blockchainTimestamp: '0xabc...123',
  }
]

export const getPendingBills = async () => {
  return new Promise(resolve => setTimeout(() => resolve([...pendingBills]), 500))
}

export const getPaymentHistory = async () => {
  return new Promise(resolve => setTimeout(() => resolve([...history]), 600))
}

export const processPayment = async (billId, method, transactionId) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const billIndex = pendingBills.findIndex(b => b.id === billId)
      if (billIndex > -1) {
        const bill = pendingBills[billIndex]
        pendingBills.splice(billIndex, 1)
        
        const newRecord = {
          ...bill,
          method,
          transactionId: transactionId || `TX-${Date.now()}`,
          date: dayjs().format('YYYY-MM-DD'),
          status: 'Paid',
          blockchainTimestamp: '0x' + Math.random().toString(16).substr(2, 40),
        }
        history.unshift(newRecord)
        resolve(newRecord)
      } else {
        reject('Bill not found')
      }
    }, 1500)
  })
}
