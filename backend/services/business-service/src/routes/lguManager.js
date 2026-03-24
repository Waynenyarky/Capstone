const express = require('express')
const router = express.Router()
const { requireJwt } = require('../middleware/auth')
const respond = require('../middleware/respond')
const BusinessProfile = require('../models/BusinessProfile')
const Inspection = require('../models/Inspection')
const Violation = require('../models/Violation')
const Appeal = require('../models/Appeal')
const AuditLog = require('../models/AuditLog')

function requireLGUManager(req, res, next) {
  const roleSlug = req._userRole || req.user?.role?.slug
  if (!['lgu_manager', 'admin'].includes(roleSlug)) {
    return respond.error(res, 403, 'forbidden', 'LGU Manager access required')
  }
  next()
}

router.use(requireJwt, requireLGUManager)

/**
 * GET /api/lgu-manager/analytics/dashboard
 * Main dashboard analytics
 */
router.get('/analytics/dashboard', async (req, res) => {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Permit counts by status (aggregate BusinessProfile.businesses)
    const permitByStatus = await BusinessProfile.aggregate([
      { $unwind: '$businesses' },
      { $group: { _id: '$businesses.applicationStatus', count: { $sum: 1 } } },
    ])
    const permitsByStatus = {}
    permitByStatus.forEach((p) => {
      permitsByStatus[p._id || 'unknown'] = p.count
    })

    // Violation counts by status
    const violationByStatus = await Violation.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])
    const violationsByStatus = {}
    violationByStatus.forEach((v) => {
      violationsByStatus[v._id || 'unknown'] = v.count
    })

    // Inspection counts by status + overdue count
    const inspectionByStatus = await Inspection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])
    const inspectionsByStatus = {}
    inspectionByStatus.forEach((i) => {
      inspectionsByStatus[i._id || 'unknown'] = i.count
    })
    const overdueInspections = await Inspection.countDocuments({
      status: { $ne: 'completed' },
      scheduledDate: { $lt: now },
    })

    // Appeal counts by status
    const appealByStatus = await Appeal.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])
    const appealsByStatus = {}
    appealByStatus.forEach((a) => {
      appealsByStatus[a._id || 'unknown'] = a.count
    })

    // Cessation counts by retirementStatus
    const cessationByStatus = await BusinessProfile.aggregate([
      { $unwind: '$businesses' },
      { $match: { 'businesses.retirementStatus': { $exists: true, $ne: '' } } },
      { $group: { _id: '$businesses.retirementStatus', count: { $sum: 1 } } },
    ])
    const cessationsByStatus = {}
    cessationByStatus.forEach((c) => {
      cessationsByStatus[c._id || 'unknown'] = c.count
    })

    // Recent activity from AuditLog (last 20)
    const recentActivity = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()
      .select('eventType userId role metadata createdAt')

    // Average processing time (submittedAt → reviewedAt for approved apps, last 30 days)
    const approvedWithTimes = await BusinessProfile.aggregate([
      { $unwind: '$businesses' },
      {
        $match: {
          'businesses.applicationStatus': 'approved',
          'businesses.submittedAt': { $gte: thirtyDaysAgo, $ne: null },
          'businesses.reviewedAt': { $ne: null },
        },
      },
      {
        $project: {
          diff: {
            $subtract: ['$businesses.reviewedAt', '$businesses.submittedAt'],
          },
        },
      },
      { $group: { _id: null, totalMs: { $sum: '$diff' }, count: { $sum: 1 } } },
    ])
    let averageProcessingTimeDays = null
    if (approvedWithTimes[0]?.count > 0 && approvedWithTimes[0]?.totalMs != null) {
      averageProcessingTimeDays =
        approvedWithTimes[0].totalMs / approvedWithTimes[0].count / (24 * 60 * 60 * 1000)
    }

    return respond.success(res, 200, {
      permitsByStatus,
      violationsByStatus,
      inspectionsByStatus,
      overdueInspections,
      appealsByStatus,
      cessationsByStatus,
      recentActivity,
      averageProcessingTimeDays,
      slaCompliance: null,
      departmentSummary: null,
      performanceTrends: null,
    })
  } catch (err) {
    console.error('GET /api/lgu-manager/analytics/dashboard error:', err)
    return respond.error(res, 500, 'dashboard_error', err.message || 'Failed to fetch dashboard')
  }
})

/**
 * GET /api/lgu-manager/overview/permits
 * Permit overview with pagination, status filter, search
 */
router.get('/overview/permits', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const status = req.query.status
    const search = req.query.search?.trim()

    const matchStage = {}
    if (status && status !== 'all') {
      matchStage['businesses.applicationStatus'] = status
    }
    if (search) {
      matchStage.$or = [
        { 'businesses.businessName': { $regex: search, $options: 'i' } },
        { 'businesses.registeredBusinessName': { $regex: search, $options: 'i' } },
        { 'businesses.applicationReferenceNumber': { $regex: search, $options: 'i' } },
      ]
    }

    const pipeline = [
      { $unwind: '$businesses' },
      { $match: matchStage },
      { $sort: { 'businesses.updatedAt': -1 } },
    ]

    const [countResult, itemsResult] = await Promise.all([
      BusinessProfile.aggregate([...pipeline, { $count: 'total' }]),
      BusinessProfile.aggregate([
        ...pipeline,
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $project: {
            businessProfileId: '$_id',
            businessId: '$businesses.businessId',
            businessName: { $ifNull: ['$businesses.registeredBusinessName', '$businesses.businessName'] },
            applicationStatus: '$businesses.applicationStatus',
            applicationReferenceNumber: '$businesses.applicationReferenceNumber',
            submittedAt: '$businesses.submittedAt',
            reviewedAt: '$businesses.reviewedAt',
            updatedAt: '$businesses.updatedAt',
          },
        },
      ]),
    ])

    const total = countResult[0]?.total || 0

    // KPI summary
    const permitByStatus = await BusinessProfile.aggregate([
      { $unwind: '$businesses' },
      { $group: { _id: '$businesses.applicationStatus', count: { $sum: 1 } } },
    ])
    const kpi = { total: 0, byStatus: {} }
    permitByStatus.forEach((p) => {
      kpi.byStatus[p._id || 'unknown'] = p.count
      kpi.total += p.count
    })

    return respond.success(res, 200, {
      kpi,
      items: itemsResult,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    })
  } catch (err) {
    console.error('GET /api/lgu-manager/overview/permits error:', err)
    return respond.error(res, 500, 'permits_error', err.message || 'Failed to fetch permits overview')
  }
})

/**
 * GET /api/lgu-manager/overview/violations-inspections
 * Violations + inspections overview
 */
router.get('/overview/violations-inspections', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const type = req.query.type || 'both' // 'violations' | 'inspections' | 'both'

    const [violationByStatus, inspectionByStatus, overdueCount] = await Promise.all([
      Violation.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Inspection.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Inspection.countDocuments({
        status: { $ne: 'completed' },
        scheduledDate: { $lt: new Date() },
      }),
    ])

    const violationsKpi = { total: 0, byStatus: {} }
    violationByStatus.forEach((v) => {
      violationsKpi.byStatus[v._id || 'unknown'] = v.count
      violationsKpi.total += v.count
    })

    const inspectionsKpi = { total: 0, byStatus: {}, overdue: overdueCount }
    inspectionByStatus.forEach((i) => {
      inspectionsKpi.byStatus[i._id || 'unknown'] = i.count
      inspectionsKpi.total += i.count
    })

    const kpi = { violations: violationsKpi, inspections: inspectionsKpi }

    let items = []
    if (type === 'violations') {
      const skip = (page - 1) * limit
      const [violations, total] = await Promise.all([
        Violation.find()
          .populate('inspectorId', 'firstName lastName')
          .populate('inspectionId', 'businessId businessProfileId')
          .sort({ issuedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Violation.countDocuments(),
      ])
      items = violations.map((v) => ({
        type: 'violation',
        _id: v._id,
        violationId: v.violationId,
        violationType: v.violationType,
        status: v.status,
        severity: v.severity,
        issuedAt: v.issuedAt,
        inspectorId: v.inspectorId?._id,
        inspectorName: v.inspectorId
          ? `${v.inspectorId.firstName || ''} ${v.inspectorId.lastName || ''}`.trim()
          : null,
      }))
      return respond.success(res, 200, {
        kpi,
        items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
      })
    }

    if (type === 'inspections') {
      const skip = (page - 1) * limit
      const [inspections, total] = await Promise.all([
        Inspection.find()
          .populate('inspectorId', 'firstName lastName')
          .populate('businessProfileId', 'businesses')
          .sort({ scheduledDate: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Inspection.countDocuments(),
      ])
      items = inspections.map((i) => {
        const business = (i.businessProfileId?.businesses || []).find((b) => b.businessId === i.businessId)
        return {
          type: 'inspection',
          _id: i._id,
          businessId: i.businessId,
          businessName: business?.businessName || business?.registeredBusinessName || 'Unknown',
          inspectionType: i.inspectionType,
          status: i.status,
          scheduledDate: i.scheduledDate,
          overallResult: i.overallResult,
          inspectorId: i.inspectorId?._id,
          inspectorName: i.inspectorId
            ? `${i.inspectorId.firstName || ''} ${i.inspectorId.lastName || ''}`.trim()
            : null,
        }
      })
      return respond.success(res, 200, {
        kpi,
        items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
      })
    }

    // both: return violations and inspections in one list (interleaved by date, limited)
    const halfLimit = Math.ceil(limit / 2)
    const [violations, inspections] = await Promise.all([
      Violation.find()
        .populate('inspectorId', 'firstName lastName')
        .sort({ issuedAt: -1 })
        .limit(halfLimit)
        .lean(),
      Inspection.find()
        .populate('inspectorId', 'firstName lastName')
        .populate('businessProfileId', 'businesses')
        .sort({ scheduledDate: -1 })
        .limit(halfLimit)
        .lean(),
    ])
    const vItems = violations.map((v) => ({
      type: 'violation',
      _id: v._id,
      violationId: v.violationId,
      status: v.status,
      date: v.issuedAt,
    }))
    const iItems = inspections.map((i) => {
      const business = (i.businessProfileId?.businesses || []).find((b) => b.businessId === i.businessId)
      return {
        type: 'inspection',
        _id: i._id,
        businessId: i.businessId,
        businessName: business?.businessName || business?.registeredBusinessName || 'Unknown',
        status: i.status,
        date: i.scheduledDate,
      }
    })
    items = [...vItems, ...iItems].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit)

    return respond.success(res, 200, {
      kpi,
      items,
      pagination: { page, limit, total: items.length, pages: 1 },
    })
  } catch (err) {
    console.error('GET /api/lgu-manager/overview/violations-inspections error:', err)
    return respond.error(
      res,
      500,
      'violations_inspections_error',
      err.message || 'Failed to fetch violations/inspections overview'
    )
  }
})

/**
 * GET /api/lgu-manager/overview/cessations
 * Cessation overview
 */
router.get('/overview/cessations', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const status = req.query.status

    const retirementSignalMatch = {
      $or: [
        { 'businesses.retirementStatus': { $exists: true, $ne: '' } },
        { 'businesses.retirementRequestedAt': { $ne: null } },
        { 'businesses.retirementConfirmedAt': { $ne: null } },
        { 'businesses.inspectorVerifiedAt': { $ne: null } },
        { 'businesses.businessStatus': 'closed' },
      ],
    }

    const normalizedProjection = {
      businessProfileId: '$_id',
      businessId: '$businesses.businessId',
      businessName: { $ifNull: ['$businesses.registeredBusinessName', '$businesses.businessName'] },
      retirementStatus: {
        $cond: [
          {
            $or: [
              { $eq: ['$businesses.retirementStatus', null] },
              { $eq: ['$businesses.retirementStatus', ''] },
            ],
          },
          {
            $cond: [{ $eq: ['$businesses.businessStatus', 'closed'] }, 'confirmed', ''],
          },
          '$businesses.retirementStatus',
        ],
      },
      retirementRequestedAt: '$businesses.retirementRequestedAt',
      retirementConfirmedAt: '$businesses.retirementConfirmedAt',
      updatedAt: '$businesses.updatedAt',
    }

    const pipeline = [
      { $unwind: '$businesses' },
      { $match: retirementSignalMatch },
      { $project: normalizedProjection },
      ...(status && status !== 'all' ? [{ $match: { retirementStatus: status } }] : []),
      { $sort: { retirementRequestedAt: -1, updatedAt: -1 } },
    ]

    const [countResult, kpiResult, itemsResult] = await Promise.all([
      BusinessProfile.aggregate([...pipeline, { $count: 'total' }]),
      BusinessProfile.aggregate([
        { $unwind: '$businesses' },
        { $match: retirementSignalMatch },
        { $project: normalizedProjection },
        { $match: { retirementStatus: { $ne: '' } } },
        { $group: { _id: '$retirementStatus', count: { $sum: 1 } } },
      ]),
      BusinessProfile.aggregate([
        ...pipeline,
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]),
    ])

    const total = countResult[0]?.total || 0
    const kpi = { total: 0, byStatus: {} }
    kpiResult.forEach((k) => {
      kpi.byStatus[k._id || 'unknown'] = k.count
      kpi.total += k.count
    })

    return respond.success(res, 200, {
      kpi,
      items: itemsResult,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    })
  } catch (err) {
    console.error('GET /api/lgu-manager/overview/cessations error:', err)
    return respond.error(res, 500, 'cessations_error', err.message || 'Failed to fetch cessations overview')
  }
})

/**
 * GET /api/lgu-manager/overview/appeals
 * Appeals overview
 */
router.get('/overview/appeals', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const status = req.query.status

    const filter = {}
    if (status && status !== 'all') filter.status = status

    const [appeals, total, appealByStatus] = await Promise.all([
      Appeal.find(filter)
        .populate('requestedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Appeal.countDocuments(filter),
      Appeal.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ])

    const kpi = { total: 0, byStatus: {} }
    appealByStatus.forEach((a) => {
      kpi.byStatus[a._id || 'unknown'] = a.count
      kpi.total += a.count
    })

    const items = appeals.map((a) => ({
      _id: a._id,
      businessId: a.businessId,
      appealType: a.appealType,
      status: a.status,
      requestedBy: a.requestedBy?._id,
      requesterName: a.requestedBy
        ? `${a.requestedBy.firstName || ''} ${a.requestedBy.lastName || ''}`.trim()
        : null,
      createdAt: a.createdAt,
      resolvedAt: a.resolvedAt,
    }))

    return respond.success(res, 200, {
      kpi,
      items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    })
  } catch (err) {
    console.error('GET /api/lgu-manager/overview/appeals error:', err)
    return respond.error(res, 500, 'appeals_error', err.message || 'Failed to fetch appeals overview')
  }
})

/**
 * GET /api/lgu-manager/analytics
 * General analytics with period filtering
 */
router.get('/analytics', async (req, res) => {
  try {
    const { period = 'month', year, month } = req.query
    const now = new Date()
    const y = parseInt(year) || now.getFullYear()
    const m = parseInt(month) || now.getMonth() + 1

    let dateFilter = {}
    if (period === 'month') {
      dateFilter = {
        $gte: new Date(y, m - 1, 1),
        $lt: new Date(y, m, 1),
      }
    } else if (period === 'quarter') {
      const q = Math.ceil(m / 3)
      dateFilter = {
        $gte: new Date(y, (q - 1) * 3, 1),
        $lt: new Date(y, q * 3, 1),
      }
    } else if (period === 'year') {
      dateFilter = {
        $gte: new Date(y, 0, 1),
        $lt: new Date(y + 1, 0, 1),
      }
    }

    const [permitsSubmittedRes, permitsApprovedRes, violationsIssued, appealsSubmitted] = await Promise.all([
      BusinessProfile.aggregate([
        { $unwind: '$businesses' },
        { $match: { 'businesses.submittedAt': dateFilter } },
        { $count: 'count' },
      ]),
      BusinessProfile.aggregate([
        { $unwind: '$businesses' },
        {
          $match: {
            'businesses.reviewedAt': dateFilter,
            'businesses.applicationStatus': 'approved',
          },
        },
        { $count: 'count' },
      ]),
      Violation.countDocuments({ issuedAt: dateFilter }),
      Appeal.countDocuments({ createdAt: dateFilter }),
    ])

    const permitsSubmitted = permitsSubmittedRes[0]?.count ?? 0
    const permitsApproved = permitsApprovedRes[0]?.count ?? 0

    return respond.success(res, 200, {
      period,
      year: y,
      month: period === 'month' ? m : undefined,
      metrics: {
        permitsSubmitted,
        permitsApproved,
        violationsIssued,
        appealsSubmitted,
      },
    })
  } catch (err) {
    console.error('GET /api/lgu-manager/analytics error:', err)
    return respond.error(res, 500, 'analytics_error', err.message || 'Failed to fetch analytics')
  }
})

/**
 * GET /api/lgu-manager/analytics/trends
 * Stub (returns null)
 */
router.get('/analytics/trends', (req, res) => {
  return respond.success(res, 200, null)
})

/**
 * GET /api/lgu-manager/reports
 * List reports (returns empty)
 */
router.get('/reports', (req, res) => {
  return respond.success(res, 200, { reports: [] })
})

/**
 * POST /api/lgu-manager/reports/generate
 * Generate report data
 */
router.post('/reports/generate', async (req, res) => {
  try {
    const { reportType, period, year, month } = req.body || {}
    const now = new Date()
    const y = parseInt(year) || now.getFullYear()
    const m = parseInt(month) || now.getMonth() + 1

    let dateFilter = {}
    if (period === 'month') {
      dateFilter = {
        $gte: new Date(y, m - 1, 1),
        $lt: new Date(y, m, 1),
      }
    } else if (period === 'year') {
      dateFilter = {
        $gte: new Date(y, 0, 1),
        $lt: new Date(y + 1, 0, 1),
      }
    }

    const [permitsByStatus, violationsCount, inspectionsCount] = await Promise.all([
      BusinessProfile.aggregate([
        { $unwind: '$businesses' },
        ...(Object.keys(dateFilter).length ? [{ $match: { 'businesses.submittedAt': dateFilter } }] : []),
        { $group: { _id: '$businesses.applicationStatus', count: { $sum: 1 } } },
      ]),
      Violation.countDocuments(
        Object.keys(dateFilter).length ? { issuedAt: dateFilter } : {}
      ),
      Inspection.countDocuments(
        Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}
      ),
    ])

    const permitsByStatusObj = {}
    permitsByStatus.forEach((p) => {
      permitsByStatusObj[p._id || 'unknown'] = p.count
    })

    return respond.success(res, 200, {
      reportType: reportType || 'general',
      period: period || 'all',
      year: y,
      month: period === 'month' ? m : undefined,
      generatedAt: new Date().toISOString(),
      data: {
        permitsByStatus: permitsByStatusObj,
        violationsCount,
        inspectionsCount,
      },
    })
  } catch (err) {
    console.error('POST /api/lgu-manager/reports/generate error:', err)
    return respond.error(res, 500, 'report_error', err.message || 'Failed to generate report')
  }
})

/**
 * GET /api/lgu-manager/payments/pending
 * Get pending payments that need verification
 */
router.get('/payments/pending', async (req, res) => {
  try {
    const Payment = require('../models/Payment')
    
    const pendingPayments = await Payment.find({
      status: 'paid',
      verificationStatus: { $in: ['pending', null] }
    })
      .populate('businessId', 'businessName')
      .sort({ createdAt: -1 })
      .lean()
    
    return respond.success(res, 200, { payments: pendingPayments })
  } catch (err) {
    console.error('GET /api/lgu-manager/payments/pending error:', err)
    return respond.error(res, 500, 'fetch_error', 'Failed to fetch pending payments')
  }
})

/**
 * PUT /api/lgu-manager/payments/:paymentId/verify
 * Verify a payment
 */
router.put('/payments/:paymentId/verify', async (req, res) => {
  try {
    const Payment = require('../models/Payment')
    const { verificationNotes, officialReceiptNumber } = req.body
    
    const payment = await Payment.findByIdAndUpdate(
      req.params.paymentId,
      {
        verificationStatus: 'verified',
        verifiedBy: req._userId,
        verifiedAt: new Date(),
        verificationNotes,
        officialReceiptNumber
      },
      { new: true }
    )
    
    if (!payment) {
      return respond.error(res, 404, 'not_found', 'Payment not found')
    }
    
    return respond.success(res, 200, { payment })
  } catch (err) {
    console.error('PUT /api/lgu-manager/payments/:paymentId/verify error:', err)
    return respond.error(res, 500, 'verification_error', 'Failed to verify payment')
  }
})

/**
 * PUT /api/lgu-manager/payments/:paymentId/reject
 * Reject a payment
 */
router.put('/payments/:paymentId/reject', async (req, res) => {
  try {
    const Payment = require('../models/Payment')
    const { rejectionReason } = req.body
    
    if (!rejectionReason) {
      return respond.error(res, 400, 'missing_reason', 'Rejection reason is required')
    }
    
    const payment = await Payment.findByIdAndUpdate(
      req.params.paymentId,
      {
        verificationStatus: 'rejected',
        rejectedBy: req._userId,
        rejectedAt: new Date(),
        rejectionReason,
        status: 'cancelled'
      },
      { new: true }
    )
    
    if (!payment) {
      return respond.error(res, 404, 'not_found', 'Payment not found')
    }
    
    return respond.success(res, 200, { payment })
  } catch (err) {
    console.error('PUT /api/lgu-manager/payments/:paymentId/reject error:', err)
    return respond.error(res, 500, 'rejection_error', 'Failed to reject payment')
  }
})

/**
 * GET /api/lgu-manager/payments/reports/daily
 * Get daily collection report
 */
router.get('/payments/reports/daily', async (req, res) => {
  try {
    const Payment = require('../models/Payment')
    const { date } = req.query
    
    const targetDate = date ? new Date(date) : new Date()
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))
    
    const payments = await Payment.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).lean()
    
    const totalCollections = payments
      .filter(p => p.verificationStatus === 'verified')
      .reduce((sum, p) => sum + (p.amount || 0), 0)
    
    const verifiedPayments = payments.filter(p => p.verificationStatus === 'verified').length
    const pendingPayments = payments.filter(p => !p.verificationStatus || p.verificationStatus === 'pending').length
    
    return respond.success(res, 200, {
      date: targetDate.toISOString(),
      totalCollections,
      verifiedPayments,
      pendingPayments,
      totalPayments: payments.length
    })
  } catch (err) {
    console.error('GET /api/lgu-manager/payments/reports/daily error:', err)
    return respond.error(res, 500, 'report_error', 'Failed to generate daily report')
  }
})

/**
 * GET /api/lgu-manager/inspections/pending
 * Get pending inspections that need assignment
 */
router.get('/inspections/pending', async (req, res) => {
  try {
    const pendingInspections = await Inspection.find({
      status: { $in: ['pending', 'unassigned'] }
    })
      .populate('businessProfileId', 'ownerName firstName lastName')
      .sort({ createdAt: 1 })
      .lean()
    
    return respond.success(res, 200, { inspections: pendingInspections })
  } catch (err) {
    console.error('GET /api/lgu-manager/inspections/pending error:', err)
    return respond.error(res, 500, 'fetch_error', 'Failed to fetch pending inspections')
  }
})

/**
 * GET /api/lgu-manager/inspectors
 * Get list of available inspectors
 */
router.get('/inspectors', async (req, res) => {
  try {
    const User = require('../models/User')
    const Role = require('../models/Role')
    
    const inspectorRole = await Role.findOne({ slug: 'inspector' })
    if (!inspectorRole) {
      return respond.success(res, 200, { inspectors: [] })
    }
    
    const inspectors = await User.find({ role: inspectorRole._id })
      .select('firstName lastName email phoneNumber')
    
    return respond.success(res, 200, { inspectors })
  } catch (err) {
    console.error('GET /api/lgu-manager/inspectors error:', err)
    return respond.error(res, 500, 'fetch_error', 'Failed to fetch inspectors')
  }
})

/**
 * GET /api/lgu-manager/inspectors/:inspectorId/workload
 * Get inspector workload statistics
 */
router.get('/inspectors/:inspectorId/workload', async (req, res) => {
  try {
    const { inspectorId } = req.params
    
    const activeInspections = await Inspection.countDocuments({
      inspectorId,
      status: { $in: ['assigned', 'scheduled', 'in_progress'] }
    })
    
    const completedInspections = await Inspection.countDocuments({
      inspectorId,
      status: 'completed'
    })
    
    const pendingInspections = await Inspection.countDocuments({
      inspectorId,
      status: 'pending'
    })
    
    return respond.success(res, 200, {
      activeInspections,
      completedInspections,
      pendingInspections,
      totalInspections: activeInspections + completedInspections + pendingInspections
    })
  } catch (err) {
    console.error('GET /api/lgu-manager/inspectors/:inspectorId/workload error:', err)
    return respond.error(res, 500, 'fetch_error', 'Failed to fetch inspector workload')
  }
})

/**
 * GET /api/lgu-manager/inspectors/:inspectorId/schedule
 * Get inspector schedule
 */
router.get('/inspectors/:inspectorId/schedule', async (req, res) => {
  try {
    const { inspectorId } = req.params
    const { startDate, endDate } = req.query
    
    const query = { inspectorId }
    
    if (startDate && endDate) {
      query.scheduledDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
    
    const schedule = await Inspection.find(query)
      .populate('businessProfileId', 'ownerName')
      .sort({ scheduledDate: 1 })
      .lean()
    
    return respond.success(res, 200, { schedule })
  } catch (err) {
    console.error('GET /api/lgu-manager/inspectors/:inspectorId/schedule error:', err)
    return respond.error(res, 500, 'fetch_error', 'Failed to fetch inspector schedule')
  }
})

module.exports = router
