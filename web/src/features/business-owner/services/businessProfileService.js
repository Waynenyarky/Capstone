import { get, post } from '@/lib/http'

export const getBusinessProfile = async () => {
  return get('/api/business/profile')
}

export const updateBusinessProfile = async (step, data) => {
  return post('/api/business/profile', { step, data })
}
