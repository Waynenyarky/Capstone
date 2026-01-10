import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'

let requests = []

export const getCessationRequests = async () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...requests]), 800)
  })
}

export const createCessationRequest = async (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newRequest = {
        ...data,
        id: uuidv4(),
        status: 'Pending',
        submissionDate: dayjs().format('YYYY-MM-DD'),
        blockchainTimestamp: '0x' + Math.random().toString(16).substr(2, 40),
      }
      requests.unshift(newRequest)
      resolve(newRequest)
    }, 1500)
  })
}

export const getAssociatedPermits = async () => {
  // Mock active permits
  return [
    { id: '1', type: "Mayor's Permit", number: 'MP-2024-001' },
    { id: '2', type: "Sanitary Permit", number: 'SP-2024-055' },
    { id: '3', type: "Fire Safety", number: 'FS-2024-102' }
  ]
}
