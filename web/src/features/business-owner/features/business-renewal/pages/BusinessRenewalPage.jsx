import React, { useState, useEffect } from 'react'
import { Card, Typography, Alert, Spin } from 'antd'
import { useAuthSession } from '@/features/authentication'
import { useSearchParams } from 'react-router-dom'
import BusinessOwnerLayout from '../../../views/components/BusinessOwnerLayout'
import BusinessRenewalWizard from '../components/BusinessRenewalWizard'
import BusinessSelector from '../components/BusinessSelector'
import { getBusinessProfile } from '@/features/business-owner/services/businessProfileService'

const { Title, Paragraph } = Typography

/**
 * Find the most relevant renewal for a business
 * Priority: submitted/approved renewals for tracking > draft renewals for continuing
 * Returns the latest renewal based on creation date
 */
const findMostRelevantRenewal = (business) => {
  if (!business?.renewals || business.renewals.length === 0) {
    return null
  }
  
  const currentYear = new Date().getFullYear()
  const currentYearRenewals = business.renewals.filter(r => r.renewalYear === currentYear)
  
  if (currentYearRenewals.length === 0) {
    return null
  }
  
  // Sort by createdAt (most recent first)
  const sortedRenewals = currentYearRenewals.sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime()
    const dateB = new Date(b.createdAt || 0).getTime()
    return dateB - dateA
  })
  
  // Priority 1: Find renewals with status submitted, under_review, approved, or rejected (for tracking)
  const trackingRenewals = sortedRenewals.filter(r => 
    ['submitted', 'under_review', 'approved', 'rejected'].includes(r.renewalStatus)
  )
  
  // Priority 2: Find draft renewals (for continuing)
  const draftRenewals = sortedRenewals.filter(r => 
    r.renewalStatus === 'draft' || !r.renewalStatus
  )
  
  // Select the most relevant renewal
  if (trackingRenewals.length > 0) {
    // Use the latest submitted/approved renewal for tracking
    return trackingRenewals[0]
  } else if (draftRenewals.length > 0) {
    // Use the latest draft renewal for continuing
    return draftRenewals[0]
  } else {
    // Fallback to the most recent renewal
    return sortedRenewals[0]
  }
}

const BusinessRenewalPage = () => {
  const { currentUser } = useAuthSession()
  const [searchParams] = useSearchParams()
  const queryBusinessId = searchParams.get('businessId')
  const queryRenewalId = searchParams.get('renewalId')
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState(null)
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [selectedRenewalData, setSelectedRenewalData] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const data = await getBusinessProfile()
        setProfile(data)
        
        // Check if query parameters are provided
        if (queryBusinessId && data?.businesses) {
          const business = data.businesses.find(b => b.businessId === queryBusinessId)
          if (business) {
            setSelectedBusinessId(business.businessId)
            setSelectedBusiness(business)
            
            // If renewalId is also provided, find the renewal
            if (queryRenewalId && business.renewals) {
              const renewal = business.renewals.find(r => r.renewalId === queryRenewalId)
              if (renewal) {
                setSelectedRenewalData(renewal)
              }
            }
            return
          }
        }
        
        // Auto-select first eligible business if no query params and available
        if (data?.businesses && data.businesses.length > 0) {
          const eligibleBusinesses = data.businesses.filter(b => 
            b.applicationStatus === 'approved' || 
            b.applicationStatus === 'submitted' ||
            b.applicationStatus === 'under_review'
          )
          if (eligibleBusinesses.length > 0) {
            const firstBusiness = eligibleBusinesses[0]
            setSelectedBusinessId(firstBusiness.businessId)
            setSelectedBusiness(firstBusiness)
            
            // Find the most relevant renewal for auto-selected business
            const renewal = findMostRelevantRenewal(firstBusiness)
            if (renewal) {
              setSelectedRenewalData(renewal)
            }
          }
        }
      } catch (error) {
        console.error('Failed to load business profile:', error)
      } finally {
        setLoading(false)
      }
    }

    if (currentUser) {
      fetchProfile()
    }
  }, [currentUser, queryBusinessId, queryRenewalId])

  const handleBusinessSelect = (businessId) => {
    setSelectedBusinessId(businessId)
    const business = profile?.businesses?.find(b => b.businessId === businessId)
    setSelectedBusiness(business || null)
    
    // Find the most relevant renewal for the selected business
    const renewal = findMostRelevantRenewal(business)
    setSelectedRenewalData(renewal)
  }

  const handleRenewalComplete = () => {
    // Refresh profile after renewal submission
    const fetchProfile = async () => {
      try {
        const data = await getBusinessProfile()
        setProfile(data)
      } catch (error) {
        console.error('Failed to refresh profile:', error)
      }
    }
    fetchProfile()
  }

  if (loading) {
    return (
      <BusinessOwnerLayout pageTitle="Business Renewal">
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, color: '#666' }}>Loading...</div>
          </div>
        </Card>
      </BusinessOwnerLayout>
    )
  }

  const businesses = profile?.businesses || []

  return (
    <BusinessOwnerLayout pageTitle="Business Renewal">
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>Business Permit Renewal</Title>
          <Paragraph type="secondary" style={{ fontSize: 16 }}>
            Renew your business registration and permits for the current year
          </Paragraph>
        </div>

        {businesses.length === 0 ? (
          <Alert
            message="No Businesses Found"
            description="Please register a business first before renewing."
            type="warning"
            showIcon
          />
        ) : (
          <>
            <div style={{ marginBottom: 32 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: '#262626', fontSize: 14 }}>
                  Select Business to Renew
                </label>
                <BusinessSelector
                  businesses={businesses}
                  selectedBusinessId={selectedBusinessId}
                  onSelect={handleBusinessSelect}
                />
              </div>
            </div>

            {selectedBusinessId && selectedBusiness ? (
              <BusinessRenewalWizard
                businessId={selectedBusinessId}
                businessData={selectedBusiness}
                renewalData={selectedRenewalData}
                onComplete={handleRenewalComplete}
              />
            ) : (
              <Alert
                message="Select a Business"
                description="Please select a business from the dropdown above to start the renewal process."
                type="info"
                showIcon
              />
            )}
          </>
        )}
      </Card>
    </BusinessOwnerLayout>
  )
}

export default BusinessRenewalPage
