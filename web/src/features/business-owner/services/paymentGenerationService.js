import { post, get, clearBusinessCsrfToken } from '@/lib/http.js'
import { createPayment } from './paymentsService'
import { updatePaymentGenerationStatus } from './businessProfileService'
import { LINE_OF_BUSINESS_BY_CATEGORY, LINE_OF_BUSINESS_BY_TAX_CODE } from '@/constants/lineOfBusiness'
import dayjs from 'dayjs'

const FEE_ASSESSMENT_PATH = '/api/business/fees/assessment'
const BUSINESS_BASE_PATH = '/api/business'

/**
 * LOB-based fee configuration (base fees in PHP).
 * These are multiplied against the business's capital/gross receipts.
 */
const LOB_BASE_FEES = {
  retail:         { mayorsFee: 2500, sanitaryFee: 500,  fireSafetyFee: 500,  zoningFee: 300,  inspectionFee: 800  },
  wholesale:      { mayorsFee: 3500, sanitaryFee: 500,  fireSafetyFee: 800,  zoningFee: 300,  inspectionFee: 800  },
  food_service:   { mayorsFee: 3000, sanitaryFee: 1000, fireSafetyFee: 800,  zoningFee: 300,  inspectionFee: 1000 },
  manufacturing:  { mayorsFee: 5000, sanitaryFee: 800,  fireSafetyFee: 1500, zoningFee: 500,  inspectionFee: 1500 },
  services:       { mayorsFee: 2000, sanitaryFee: 300,  fireSafetyFee: 500,  zoningFee: 200,  inspectionFee: 500  },
  financial:      { mayorsFee: 6000, sanitaryFee: 300,  fireSafetyFee: 500,  zoningFee: 500,  inspectionFee: 600  },
  real_estate:    { mayorsFee: 4000, sanitaryFee: 300,  fireSafetyFee: 500,  zoningFee: 1000, inspectionFee: 800  },
  transportation: { mayorsFee: 3000, sanitaryFee: 300,  fireSafetyFee: 800,  zoningFee: 300,  inspectionFee: 800  },
  agriculture:    { mayorsFee: 1500, sanitaryFee: 500,  fireSafetyFee: 300,  zoningFee: 200,  inspectionFee: 500  },
  construction:   { mayorsFee: 4000, sanitaryFee: 300,  fireSafetyFee: 1200, zoningFee: 500,  inspectionFee: 1200 },
  mining:         { mayorsFee: 8000, sanitaryFee: 500,  fireSafetyFee: 1500, zoningFee: 1000, inspectionFee: 1500 },
  utilities:      { mayorsFee: 6000, sanitaryFee: 800,  fireSafetyFee: 1500, zoningFee: 800,  inspectionFee: 1200 },
  default:        { mayorsFee: 2000, sanitaryFee: 300,  fireSafetyFee: 500,  zoningFee: 200,  inspectionFee: 500  },
}

/**
 * Resolve which LOB config to use given the raw LOB string from the business object.
 * Accepts category slug (e.g. 'food_service') or tax code (e.g. 'FDS').
 */
function resolveLobFees(lob) {
  if (!lob) return LOB_BASE_FEES.default
  const byCategory = LINE_OF_BUSINESS_BY_CATEGORY[lob]
  if (byCategory) return LOB_BASE_FEES[byCategory.lineOfBusiness] || LOB_BASE_FEES.default
  const byTax = LINE_OF_BUSINESS_BY_TAX_CODE[lob.toUpperCase()]
  if (byTax) return LOB_BASE_FEES[byTax.lineOfBusiness] || LOB_BASE_FEES.default
  // Try matching the lob string directly
  const direct = LOB_BASE_FEES[lob]
  if (direct) return direct
  // Partial match
  const key = Object.keys(LOB_BASE_FEES).find(k => lob.toLowerCase().includes(k))
  return key ? LOB_BASE_FEES[key] : LOB_BASE_FEES.default
}

/**
 * Build a flat list of fee line items from the resolved LOB config.
 * @returns {Array<{type, description, amount}>}
 */
function buildFeeLineItems(fees, applicationId) {
  const dueDate = dayjs().add(30, 'day').toISOString()

  return [
    {
      paymentType: 'general_permit_fee',
      description: "Mayor's Permit – Business Registration Fee",
      amount: fees.mayorsFee,
      dueDate,
      relatedEntityType: 'registration',
      relatedEntityId: applicationId,
    },
    {
      paymentType: 'other',
      description: 'Sanitary Permit Fee',
      amount: fees.sanitaryFee,
      dueDate,
      relatedEntityType: 'registration',
      relatedEntityId: applicationId,
    },
    {
      paymentType: 'other',
      description: 'Fire Safety Inspection Fee (BFP)',
      amount: fees.fireSafetyFee,
      dueDate,
      relatedEntityType: 'registration',
      relatedEntityId: applicationId,
    },
    {
      paymentType: 'other',
      description: 'Zoning / Locational Clearance Fee',
      amount: fees.zoningFee,
      dueDate,
      relatedEntityType: 'registration',
      relatedEntityId: applicationId,
    },
    {
      paymentType: 'other',
      description: 'Business Inspection Fee',
      amount: fees.inspectionFee,
      dueDate,
      relatedEntityType: 'registration',
      relatedEntityId: applicationId,
    },
  ]
}

/**
 * Try fetching a server-computed fee assessment first.
 * Falls back to the local LOB-based calculation if the endpoint fails.
 */
async function fetchServerAssessment(businessId, applicationData) {
  try {
    const res = await post(FEE_ASSESSMENT_PATH, {
      businessId,
      applicationId: applicationData?.applicationId,
      lob: applicationData?.primaryLineOfBusiness || applicationData?.lineOfBusiness,
      businessType: applicationData?.businessType,
      capitalInvestment: applicationData?.capitalInvestment,
      grossReceipts: applicationData?.grossReceipts,
    })
    if (res?.success && Array.isArray(res?.fees) && res.fees.length > 0) {
      return res.fees
    }
    return null
  } catch {
    return null
  }
}

/**
 * Ensure business profile exists and resolve correct business ID
 * @param {object} applicationData - Application data with potential business IDs
 * @returns {Promise<{business: object, businessId: string}>}
 */
async function ensureBusinessExists(applicationData) {
  // Try multiple ID resolution strategies
  const possibleIds = [
    applicationData?.businessId,
    applicationData?._id,
    applicationData?.applicationId,
    applicationData?.businessId?._id, // Handle nested business object
    applicationData?.businessId?.businessId
  ].filter(Boolean)

  console.log('Attempting to resolve business profile from IDs:', possibleIds)

  for (const id of possibleIds) {
    try {
      console.log(`Trying business ID: ${id}`)
      // Use get() directly to fetch business by ID
      const response = await get(`${BUSINESS_BASE_PATH}/businesses/${id}`)
      if (response && response.business) {
        console.log(`Found business profile with ID: ${id}`)
        return { business: response.business, businessId: id }
      }
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error'
      console.log(`Failed to get business with ID ${id}:`, errorMessage)
      
      // If it's a 404, continue trying other IDs
      if (error?.status === 404 || errorMessage.includes('404')) {
        continue
      }
      
      // If it's a CSRF or network error, wait and retry once
      if (errorMessage.includes('csrf') || errorMessage.includes('network') || errorMessage.includes('fetch')) {
        console.log(`Network/CSRF error for ID ${id}, retrying once...`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        try {
          const response = await get(`${BUSINESS_BASE_PATH}/businesses/${id}`)
          if (response && response.business) {
            console.log(`Found business profile with ID ${id} on retry`)
            return { business: response.business, businessId: id }
          }
        } catch (retryError) {
          console.log(`Retry failed for ID ${id}:`, retryError?.message || 'Unknown error')
        }
      }
      
      // Continue trying other IDs
    }
  }

  // If no business found with any ID, try to create from application
  console.log('No existing business found, attempting to create from application')
  
  // As a fallback, try to create a minimal business object from application data
  if (applicationData) {
    console.log('Creating fallback business object from application data')
    const fallbackBusiness = {
      businessId: applicationData.businessId || applicationData._id,
      businessName: applicationData.businessName || applicationData.registeredBusinessName || 'Unknown Business',
      primaryLineOfBusiness: applicationData.primaryLineOfBusiness || applicationData.lineOfBusiness,
      applicationStatus: 'approved',
      _id: applicationData._id
    }
    return { business: fallbackBusiness, businessId: fallbackBusiness.businessId }
  }
  
  throw new Error(`Business profile not found. Tried IDs: ${possibleIds.join(', ')}. Please ensure the business profile exists before generating payments.`)
}

/**
 * Create payment with CSRF error handling and retry logic
 * @param {object} paymentData - Payment data
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<object>}
 */
async function createPaymentWithRetry(paymentData, retryCount = 0) {
  try {
    return await createPayment(paymentData)
  } catch (error) {
    // Handle CSRF token errors specifically
    if (error?.message?.includes('csrf-token') || error?.message?.includes('404') && error?.message?.includes('csrf-token')) {
      console.log('CSRF token error detected, clearing cache and retrying...')
      
      // Clear CSRF token cache and retry
      await clearBusinessCsrfToken('/api/business')
      
      if (retryCount < 2) {
        console.log(`Retrying payment creation (attempt ${retryCount + 1})`)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        return await createPaymentWithRetry(paymentData, retryCount + 1)
      } else {
        throw new Error(`CSRF token error after ${retryCount + 1} attempts. Please check backend CSRF endpoints.`)
      }
    }
    
    // Handle 409 Conflict (duplicate payment) - treat as success since payment already exists
    if (error?.status === 409 || error?.message?.includes('DUPLICATE') || error?.message?.includes('already exists')) {
      console.log('Payment already exists (409 Conflict), treating as success')
      return { alreadyExists: true, message: 'Payment already exists' }
    }
    
    // Handle other API errors
    if (error?.status === 404) {
      throw new Error(`API endpoint not found: ${error.message}. Please check backend API configuration.`)
    }
    
    if (error?.status === 500) {
      throw new Error(`Server error during payment creation: ${error.message}. Please check backend logs.`)
    }
    
    // Re-throw other errors
    throw error
  }
}

/**
 * Generate payment records for an approved business application.
 * Called after the LGU officer approves the application.
 *
 * @param {string} businessId
 * @param {object} applicationData - Full application object (status, LOB, IDs, etc.)
 * @returns {Promise<{success: boolean, payments: Array, errors: Array}>}
 */
export async function generatePaymentsForApprovedBusiness(businessId, applicationData) {
  const result = { success: false, payments: [], errors: [] }

  // 0. Validate and resolve business profile
  let resolvedBusinessId = businessId
  try {
    const { businessId: validBusinessId } = await ensureBusinessExists(applicationData)
    resolvedBusinessId = validBusinessId
    console.log('Business profile resolved successfully:', validBusinessId)
  } catch (error) {
    const errorMessage = error.message || 'Unknown error during business resolution'
    result.errors.push(errorMessage)
    console.error('Business profile resolution failed:', error)
    
    // Try to continue with fallback business data if available
    if (applicationData && (applicationData.businessId || applicationData._id)) {
      console.log('Attempting to continue with application data as fallback')
      resolvedBusinessId = applicationData.businessId || applicationData._id
    } else {
      return result
    }
  }

  const applicationId = applicationData?.applicationId || applicationData?._id
  const lob = applicationData?.primaryLineOfBusiness || applicationData?.lineOfBusiness

  // Guard against duplicate generation (e.g., manual regenerate/retry)
  let existingPendingPayments = []
  try {
    const existing = await get(`/api/business/payments?businessId=${resolvedBusinessId}&status=pending&limit=200`)
    existingPendingPayments = Array.isArray(existing) ? existing : existing?.data || []
  } catch {
    existingPendingPayments = []
  }

  // 1. Try server-side assessment first
  const serverFees = await fetchServerAssessment(resolvedBusinessId, applicationData)
  let lineItems

  if (serverFees) {
    lineItems = serverFees.map(f => ({
      paymentType: f.paymentType || 'other',
      description: f.description || f.name || 'Fee',
      amount: f.amount,
      dueDate: f.dueDate || dayjs().add(30, 'day').toISOString(),
      relatedEntityType: 'registration',
      relatedEntityId: applicationId,
    }))
  } else {
    // 2. Fall back to local LOB calculation
    const fees = resolveLobFees(lob)
    lineItems = buildFeeLineItems(fees, applicationId)
  }

  // 3. Create payment records one by one with CSRF retry; collect errors without aborting
  for (const item of lineItems) {
    const duplicate = existingPendingPayments.find((p) => (
      p?.businessId === resolvedBusinessId
      && p?.paymentType === item.paymentType
      && (p?.relatedEntityId || '') === (item.relatedEntityId || '')
      && (p?.relatedEntityType || '') === (item.relatedEntityType || '')
      && (p?.description || '') === (item.description || '')
      && Number(p?.amount || 0) === Number(item.amount || 0)
      && p?.status === 'pending'
    ))

    if (duplicate) {
      console.log(`Skipping duplicate pending payment: ${item.description}`)
      result.payments.push(duplicate)
      continue
    }

    try {
      const payment = await createPaymentWithRetry({
        businessId: resolvedBusinessId,
        paymentType: item.paymentType,
        description: item.description,
        amount: item.amount,
        dueDate: item.dueDate,
        relatedEntityType: item.relatedEntityType,
        relatedEntityId: item.relatedEntityId,
        status: 'pending',
        metadata: {
          generatedAt: new Date().toISOString(),
          source: 'approval_auto_generation',
          applicationId,
        },
      })
      result.payments.push(payment)
      console.log(`Payment created successfully: ${item.description}`)
    } catch (err) {
      const errorMsg = `Failed to create "${item.description}": ${err?.message || 'Unknown error'}`
      result.errors.push(errorMsg)
      console.error(errorMsg, err)
    }
  }

  result.success = result.payments.length > 0
  
  if (result.success) {
    console.log(`Successfully generated ${result.payments.length} payment(s) for business ${resolvedBusinessId}`)
  } else {
    console.log(`No payments generated for business ${resolvedBusinessId}. Errors: ${result.errors.join(', ')}`)
  }
  
  // 4. Update business payment generation status
  try {
    await updatePaymentGenerationStatus(resolvedBusinessId, {
      paymentsGenerated: result.success,
      paymentsGeneratedAt: new Date().toISOString(),
      paymentGenerationErrors: result.errors,
      lastPaymentGenerationAttempt: new Date().toISOString(),
      paymentGenerationMetadata: {
        totalAmount: result.payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        paymentCount: result.payments.length,
        feeBreakdown: result.payments.map(p => ({ description: p.description, amount: p.amount }))
      }
    })
    console.log('Payment generation status updated successfully')
  } catch (statusError) {
    const statusErrorMsg = `Failed to update payment generation status: ${statusError?.message || 'Unknown error'}`
    result.errors.push(statusErrorMsg)
    console.error(statusErrorMsg, statusError)
    // Don't fail the entire operation if status update fails, but log it
  }

  return result
}

/**
 * Check whether payments have already been generated for a business.
 * Prevents duplicate generation on re-renders or retries.
 *
 * @param {string} businessId
 * @returns {Promise<boolean>}
 */
export async function hasPaymentsGenerated(businessId) {
  if (!businessId) return false
  try {
    const res = await get(`/api/business/payments?businessId=${businessId}&limit=1`)
    const payments = Array.isArray(res) ? res : res?.data || []
    return payments.length > 0
  } catch {
    return false
  }
}
