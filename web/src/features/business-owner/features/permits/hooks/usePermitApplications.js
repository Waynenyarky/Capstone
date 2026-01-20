import { useState, useEffect, useCallback } from 'react'
import { getBusinesses, getBusinessProfile } from '@/features/business-owner/services/businessProfileService'
import { getApplicationStatus } from '@/features/business-owner/features/business-registration/services/businessRegistrationService'

/**
 * Determine the correct renewal status with priority logic
 * Prevents showing "Draft" when renewal has been submitted or approved
 * @param {Object} renewal - Renewal object from database
 * @returns {string} - Correct renewal status
 */
function determineRenewalStatus(renewal) {
  const currentStatus = renewal.renewalStatus || 'draft'
  
  // High priority statuses - never override these
  if (['approved', 'rejected', 'under_review'].includes(currentStatus)) {
    return currentStatus
  }
  
  // If already submitted, keep it
  if (currentStatus === 'submitted') {
    return 'submitted'
  }
  
  // Check if renewal has been submitted (has referenceNumber or submittedAt)
  const hasReferenceNumber = renewal.referenceNumber && 
                             renewal.referenceNumber !== 'N/A' && 
                             renewal.referenceNumber.trim() !== ''
  const hasSubmittedAt = renewal.submittedAt && (
                         renewal.submittedAt instanceof Date || 
                         (typeof renewal.submittedAt === 'string' && renewal.submittedAt.trim() !== '') ||
                         (typeof renewal.submittedAt === 'object' && renewal.submittedAt !== null)
                         )
  
  // If status is 'draft' but has submission indicators, upgrade to 'submitted'
  if (currentStatus === 'draft' && (hasReferenceNumber || hasSubmittedAt)) {
    return 'submitted'
  }
  
  // Otherwise, return the current status (or 'draft' if not set)
  return currentStatus
}

export function usePermitApplications() {
  const [permits, setPermits] = useState([])
  const [renewals, setRenewals] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchBusinessRegistrations = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all businesses and business profile to get updatedAt
      const [businessesResponse, profile] = await Promise.all([
        getBusinesses(),
        getBusinessProfile().catch(() => null) // Don't fail if profile fetch fails
      ])
      
      const { businesses } = businessesResponse
      
      // Handle empty businesses array
      if (!businesses || businesses.length === 0) {
        setPermits([])
        setRenewals([])
        setLoading(false)
        return
      }
      
      // Create a map of businessId to business from profile for updatedAt
      const profileBusinessMap = new Map()
      if (profile?.businesses) {
        profile.businesses.forEach(b => {
          profileBusinessMap.set(b.businessId, b)
        })
      }
      
      // Fetch status for each business
      const registrationsWithStatus = await Promise.all(
        businesses.map(async (business) => {
          try {
            console.log(`[usePermitApplications] Fetching status for businessId=${business.businessId}`)
            const statusData = await getApplicationStatus(business.businessId)
            console.log(`[usePermitApplications] Status retrieved for businessId=${business.businessId}, applicationStatus=${statusData?.applicationStatus || 'N/A'}`)
            const profileBusiness = profileBusinessMap.get(business.businessId)
            
            // Get updatedAt from profile business if available, otherwise use business or statusData
            const updatedAt = profileBusiness?.updatedAt || 
                            business.updatedAt || 
                            statusData?.submittedAt || 
                            business.createdAt || 
                            null
            
            return {
              id: business.businessId,
              businessId: business.businessId,
              businessName: business.businessName,
              referenceNumber: statusData?.applicationReferenceNumber || 'N/A',
              registrationDate: statusData?.submittedAt || business.createdAt || null,
              status: statusData?.applicationStatus || 'draft',
              isPrimary: business.isPrimary || false,
              registrationStatus: business.registrationStatus || 'not_yet_registered',
              updatedAt: updatedAt,
              createdAt: business.createdAt || null
            }
          } catch (error) {
            // If status fetch fails, still include the business with default values
            console.error(`Failed to fetch status for business ${business.businessId}:`, error)
            const profileBusiness = profileBusinessMap.get(business.businessId)
            const updatedAt = profileBusiness?.updatedAt || business.updatedAt || business.createdAt || null
            
            return {
              id: business.businessId,
              businessId: business.businessId,
              businessName: business.businessName,
              referenceNumber: 'N/A',
              registrationDate: business.createdAt || null,
              status: 'draft',
              isPrimary: business.isPrimary || false,
              registrationStatus: business.registrationStatus || 'not_yet_registered',
              updatedAt: updatedAt,
              createdAt: business.createdAt || null
            }
          }
        })
      )
      
      // Sort by updatedAt (newest first), then by createdAt if updatedAt is not available
      const sortedRegistrations = registrationsWithStatus.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0)
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0)
        return dateB - dateA // Descending order (newest first)
      })
      
      setPermits(sortedRegistrations)
    } catch (err) {
      console.error('Failed to fetch business registrations:', err)
      setPermits([])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRenewals = useCallback(async () => {
    try {
      // Fetch full business profile to get renewals
      const profile = await getBusinessProfile()
      
      if (!profile || !profile.businesses || profile.businesses.length === 0) {
        setRenewals([])
        return
      }

      // Transform renewals from nested structure to flat array
      const renewalsMap = new Map() // Use Map to deduplicate by businessId
      
      profile.businesses.forEach((business) => {
        if (business.renewals && Array.isArray(business.renewals)) {
          business.renewals.forEach((renewal) => {
            const renewalId = renewal.renewalId
            const businessId = business.businessId
            
            // If businessId already exists, keep the one with higher priority status
            if (renewalsMap.has(businessId)) {
              const existing = renewalsMap.get(businessId)
              const existingStatus = existing.renewalStatus
              const newStatus = determineRenewalStatus(renewal)
              
              // Status priority: approved > rejected > under_review > submitted > draft
              const statusPriority = {
                'approved': 5,
                'rejected': 4,
                'under_review': 3,
                'submitted': 2,
                'draft': 1
              }
              
              // Keep the one with higher priority status, or if same priority, keep the newer one
              const existingPriority = statusPriority[existingStatus] || 0
              const newPriority = statusPriority[newStatus] || 0
              
              if (newPriority > existingPriority) {
                // Replace with higher priority status
                renewalsMap.set(businessId, {
                  id: businessId,
                  renewalId: renewalId,
                  referenceNumber: renewal.referenceNumber || 'N/A',
                  businessId: businessId,
                  businessName: business.businessName,
                  renewalYear: renewal.renewalYear,
                  renewalStatus: newStatus,
                  paymentStatus: renewal.payment?.status || 'pending',
                  submittedAt: renewal.submittedAt || null,
                  createdAt: renewal.createdAt || null,
                  updatedAt: renewal.updatedAt || renewal.submittedAt || renewal.createdAt || null,
                  isPrimary: business.isPrimary || false
                })
              } else if (newPriority === existingPriority) {
                // If same priority, keep the one with the latest updatedAt
                const existingDate = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 
                                    (existing.createdAt ? new Date(existing.createdAt).getTime() : 0)
                const newDate = renewal.updatedAt ? new Date(renewal.updatedAt).getTime() :
                               (renewal.createdAt ? new Date(renewal.createdAt).getTime() : 0)
                if (newDate > existingDate) {
                  renewalsMap.set(businessId, {
                    id: businessId,
                    renewalId: renewalId,
                    referenceNumber: renewal.referenceNumber || 'N/A',
                    businessId: businessId,
                    businessName: business.businessName,
                    renewalYear: renewal.renewalYear,
                    renewalStatus: newStatus,
                    paymentStatus: renewal.payment?.status || 'pending',
                    submittedAt: renewal.submittedAt || null,
                    createdAt: renewal.createdAt || null,
                    updatedAt: renewal.updatedAt || renewal.submittedAt || renewal.createdAt || null,
                    isPrimary: business.isPrimary || false
                  })
                }
              }
            } else {
              // First time seeing this businessId, add it
              renewalsMap.set(businessId, {
                id: businessId,
                renewalId: renewalId,
                referenceNumber: renewal.referenceNumber || 'N/A',
                businessId: businessId,
                businessName: business.businessName,
                renewalYear: renewal.renewalYear,
                renewalStatus: determineRenewalStatus(renewal),
                paymentStatus: renewal.payment?.status || 'pending',
                submittedAt: renewal.submittedAt || null,
                createdAt: renewal.createdAt || null,
                updatedAt: renewal.updatedAt || renewal.submittedAt || renewal.createdAt || null,
                isPrimary: business.isPrimary || false
              })
            }
          })
        }
      })

      // Convert Map to array (each businessId appears only once)
      const renewalsList = Array.from(renewalsMap.values())
      
      // Sort by updatedAt (newest first), then by createdAt if updatedAt is not available
      const sortedRenewals = renewalsList.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0)
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0)
        return dateB - dateA // Descending order (newest first)
      })
      
      setRenewals(sortedRenewals)
    } catch (err) {
      console.error('Failed to fetch renewals:', err)
      setRenewals([])
    }
  }, [])

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchBusinessRegistrations(),
        fetchRenewals()
      ])
    } catch (err) {
      console.error('Failed to fetch permit data:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchBusinessRegistrations, fetchRenewals])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Add automatic polling to refresh status every 30 seconds
  // This ensures Business Owner sees status updates when LGU Officer reviews applications
  useEffect(() => {
    if (!loading) {
      const interval = setInterval(() => {
        console.log('[usePermitApplications] Auto-refreshing permit applications status...')
        fetchAllData()
      }, 30000) // Refresh every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [loading, fetchAllData])

  // Also refresh when page becomes visible (using Visibility API)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !loading) {
        console.log('[usePermitApplications] Page became visible, refreshing permit applications status...')
        fetchAllData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [loading, fetchAllData])

  return {
    permits,
    renewals,
    loading,
    refresh: fetchAllData
  }
}
