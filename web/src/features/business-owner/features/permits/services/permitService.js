import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'

// Mock Data
let permits = [
  {
    id: '1',
    permitType: 'Mayor\'s Permit',
    applicationNumber: 'APP-20240101-001',
    applicationDate: '2024-01-01',
    validityStart: '2024-01-01',
    validityEnd: '2024-12-31',
    status: 'Approved',
    fees: 5000,
    blockchainTimestamp: '0x123...abc',
  }
]

export const getPermits = async () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...permits]), 800)
  })
}

export const createPermit = async (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newPermit = {
        ...data,
        id: uuidv4(),
        applicationDate: dayjs().format('YYYY-MM-DD'),
        status: 'Pending',
        blockchainTimestamp: '0x' + Math.random().toString(16).substr(2, 40), // Mock Hash
      }
      permits.unshift(newPermit)
      resolve(newPermit)
    }, 1500)
  })
}

export const calculateFee = (type, size) => {
  // Mock calculation logic
  let base = 1000
  if (type === 'Mayor\'s Permit') base = 5000
  if (type === 'Sanitary Permit') base = 2000
  if (type === 'Fire Safety') base = 1500
  
  if (size === 'Large') base *= 2
  if (size === 'Medium') base *= 1.5
  
  return base
}
