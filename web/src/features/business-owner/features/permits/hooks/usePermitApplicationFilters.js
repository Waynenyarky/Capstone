import { useState, useMemo } from 'react'

const INITIAL_REGISTRATION_FILTERS = {
  businessName: '',
  businessId: '',
  referenceNumber: '',
  dateRange: null,
  isPrimary: null
}

const INITIAL_RENEWAL_FILTERS = {
  businessName: '',
  businessId: '',
  referenceNumber: '',
  renewalYear: null,
  renewalStatus: null,
  paymentStatus: null,
  dateRange: null
}

function isFilterValueActive(value) {
  if (value === null || value === '') return false
  if (Array.isArray(value)) return value.length > 0
  return true
}

/**
 * Hook for permit application list filters (registration + renewal).
 * @param {Array} permits - Business registration list
 * @param {Array} renewals - Business renewal list
 * @returns Filter state, setters, clear functions, derived filtered lists and renewal years
 */
export function usePermitApplicationFilters(permits = [], renewals = []) {
  const [registrationFilters, setRegistrationFilters] = useState(INITIAL_REGISTRATION_FILTERS)
  const [renewalFilters, setRenewalFilters] = useState(INITIAL_RENEWAL_FILTERS)

  const filteredPermits = useMemo(() => {
    return permits.filter(permit => {
      if (registrationFilters.businessName &&
          !permit.businessName?.toLowerCase().includes(registrationFilters.businessName.toLowerCase())) {
        return false
      }
      if (registrationFilters.businessId &&
          !permit.businessId?.toLowerCase().includes(registrationFilters.businessId.toLowerCase())) {
        return false
      }
      if (registrationFilters.referenceNumber &&
          !permit.referenceNumber?.toLowerCase().includes(registrationFilters.referenceNumber.toLowerCase())) {
        return false
      }
      if (registrationFilters.dateRange?.[0] && registrationFilters.dateRange?.[1]) {
        const permitDate = permit.registrationDate ? new Date(permit.registrationDate) : null
        if (!permitDate) return false
        const startDate = registrationFilters.dateRange[0].startOf('day').toDate()
        const endDate = registrationFilters.dateRange[1].endOf('day').toDate()
        if (permitDate < startDate || permitDate > endDate) return false
      }
      if (registrationFilters.isPrimary !== null && permit.isPrimary !== registrationFilters.isPrimary) {
        return false
      }
      return true
    })
  }, [permits, registrationFilters])

  const filteredRenewals = useMemo(() => {
    return renewals.filter(renewal => {
      if (renewalFilters.businessName &&
          !renewal.businessName?.toLowerCase().includes(renewalFilters.businessName.toLowerCase())) {
        return false
      }
      if (renewalFilters.businessId &&
          !renewal.businessId?.toLowerCase().includes(renewalFilters.businessId.toLowerCase())) {
        return false
      }
      if (renewalFilters.referenceNumber &&
          !renewal.referenceNumber?.toLowerCase().includes(renewalFilters.referenceNumber.toLowerCase())) {
        return false
      }
      if (renewalFilters.renewalYear && renewal.renewalYear !== renewalFilters.renewalYear) {
        return false
      }
      if (renewalFilters.renewalStatus) {
        if (renewalFilters.renewalStatus === 'pending') {
          if (renewal.renewalStatus !== 'submitted' && renewal.renewalStatus !== 'under_review') {
            return false
          }
        } else if (renewal.renewalStatus !== renewalFilters.renewalStatus) {
          return false
        }
      }
      if (renewalFilters.paymentStatus && renewal.paymentStatus !== renewalFilters.paymentStatus) {
        return false
      }
      if (renewalFilters.dateRange?.[0] && renewalFilters.dateRange?.[1]) {
        const submittedDate = renewal.submittedAt ? new Date(renewal.submittedAt) : null
        if (!submittedDate) return false
        const startDate = renewalFilters.dateRange[0].startOf('day').toDate()
        const endDate = renewalFilters.dateRange[1].endOf('day').toDate()
        if (submittedDate < startDate || submittedDate > endDate) return false
      }
      return true
    })
  }, [renewals, renewalFilters])

  const renewalYears = useMemo(() => {
    const years = new Set()
    renewals.forEach(renewal => {
      if (renewal.renewalYear) years.add(renewal.renewalYear)
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [renewals])

  const clearRegistrationFilters = () => setRegistrationFilters(INITIAL_REGISTRATION_FILTERS)
  const clearRenewalFilters = () => setRenewalFilters(INITIAL_RENEWAL_FILTERS)

  const hasActiveRegistrationFilters = useMemo(
    () => Object.values(registrationFilters).some(isFilterValueActive),
    [registrationFilters]
  )
  const hasActiveRenewalFilters = useMemo(
    () => Object.values(renewalFilters).some(isFilterValueActive),
    [renewalFilters]
  )

  return {
    registrationFilters,
    setRegistrationFilters,
    renewalFilters,
    setRenewalFilters,
    clearRegistrationFilters,
    clearRenewalFilters,
    hasActiveRegistrationFilters,
    hasActiveRenewalFilters,
    filteredPermits,
    filteredRenewals,
    renewalYears
  }
}
