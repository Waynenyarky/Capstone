import { useState, useEffect, useCallback } from 'react'
import { getBusinesses } from '@/features/business-owner/services/businessProfileService'
import { getApplicationStatus } from '@/features/business-owner/features/business-registration/services/businessRegistrationService'

export function usePermitApplications() {
  const [permits, setPermits] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchBusinessRegistrations = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all businesses
      const { businesses } = await getBusinesses()
      
      // Handle empty businesses array
      if (!businesses || businesses.length === 0) {
        setPermits([])
        setLoading(false)
        return
      }
      
      // Fetch status for each business
      const registrationsWithStatus = await Promise.all(
        businesses.map(async (business) => {
          try {
            const statusData = await getApplicationStatus(business.businessId)
            return {
              id: business.businessId,
              businessId: business.businessId,
              businessName: business.businessName,
              referenceNumber: statusData?.applicationReferenceNumber || 'N/A',
              registrationDate: statusData?.submittedAt || business.createdAt || null,
              status: statusData?.applicationStatus || 'draft',
              isPrimary: business.isPrimary || false,
              registrationStatus: business.registrationStatus || 'not_yet_registered'
            }
          } catch (error) {
            // If status fetch fails, still include the business with default values
            console.error(`Failed to fetch status for business ${business.businessId}:`, error)
            return {
              id: business.businessId,
              businessId: business.businessId,
              businessName: business.businessName,
              referenceNumber: 'N/A',
              registrationDate: business.createdAt || null,
              status: 'draft',
              isPrimary: business.isPrimary || false,
              registrationStatus: business.registrationStatus || 'not_yet_registered'
            }
          }
        })
      )
      
      setPermits(registrationsWithStatus)
    } catch (err) {
      console.error('Failed to fetch business registrations:', err)
      setPermits([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBusinessRegistrations()
  }, [fetchBusinessRegistrations])

  return {
    permits,
    loading,
    refresh: fetchBusinessRegistrations
  }
}
