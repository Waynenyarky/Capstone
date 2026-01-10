import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'

let appeals = [
  {
    id: '1',
    type: 'Permit Rejection',
    referenceNumber: 'APP-2023-REJ-001',
    reason: 'Incorrect document format, re-submitting with clarifications.',
    status: 'Reviewed',
    assignedOfficer: 'Officer John Doe',
    date: '2023-11-20',
    blockchainTimestamp: '0xdef...456',
  }
]

export const getAppeals = async () => {
  return new Promise(resolve => setTimeout(() => resolve([...appeals]), 600))
}

export const createAppeal = async (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newAppeal = {
        ...data,
        id: uuidv4(),
        status: 'Pending',
        assignedOfficer: 'Pending Assignment',
        date: dayjs().format('YYYY-MM-DD'),
        blockchainTimestamp: '0x' + Math.random().toString(16).substr(2, 40),
      }
      appeals.unshift(newAppeal)
      resolve(newAppeal)
    }, 1200)
  })
}
