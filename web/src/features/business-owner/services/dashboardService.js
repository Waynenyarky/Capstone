import { get } from '@/lib/http.js'

const BASE_PATH = '/api/business/dashboard'

/**
 * Get dashboard statistics for business owner
 * @returns {Promise<{
 *   totalBusinesses: number,
 *   activeBusinesses: number,
 *   renewalsDue: number,
 *   renewalsDueList: Array<{ businessId: string, businessName: string }>,
 *   pendingPostRequirements: number,
 *   overduePostRequirements: number,
 *   openAppeals: number,
 *   pendingEditRequests: number,
 *   recentApplications: Array<{ businessId: string, businessName: string, status: string }>
 * }>}
 */
export async function getOwnerStats() {
  const response = await get(`${BASE_PATH}/owner-stats`)
  return response?.data || {
    totalBusinesses: 0,
    activeBusinesses: 0,
    renewalsDue: 0,
    renewalsDueList: [],
    pendingPostRequirements: 0,
    overduePostRequirements: 0,
    openAppeals: 0,
    pendingEditRequests: 0,
    recentApplications: []
  }
}
