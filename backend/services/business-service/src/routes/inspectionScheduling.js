const express = require('express');
const router = express.Router();
const { requireJwt, requireRole } = require('../middleware/auth');
const respond = require('../middleware/respond');
const inspectionSchedulingService = require('../services/inspectionSchedulingService');

// GET /api/inspections/available-slots - Get available inspection slots
router.get('/available-slots', requireJwt, async (req, res) => {
  try {
    const { startDate, endDate, inspectorId, barangay } = req.query;
    
    if (!startDate || !endDate) {
      return respond.error(res, 400, 'dates_required', 'Start date and end date are required');
    }
    
    const slots = await inspectionSchedulingService.getAvailableSlots(
      startDate,
      endDate,
      inspectorId || null,
      barangay || null
    );
    
    res.json({ slots });
  } catch (err) {
    console.error('GET /api/inspections/available-slots error:', err);
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch available slots');
  }
});

// POST /api/inspections/book - Book an inspection slot
router.post('/book', requireJwt, requireRole(['business_owner', 'admin']), async (req, res) => {
  try {
    const { slotId, businessId, inspectionType, notes } = req.body;
    const userId = req._userId;
    
    if (!slotId || !businessId) {
      return respond.error(res, 400, 'required_fields', 'Slot ID and business ID are required');
    }
    
    // Check prerequisites
    const prerequisites = await inspectionSchedulingService.checkPrerequisites(businessId);
    if (!prerequisites.canSchedule) {
      return respond.error(res, 400, 'prerequisites_not_met', 
        `Cannot schedule inspection. Missing requirements: ${prerequisites.missingRequirements.join(', ')}`);
    }
    
    const result = await inspectionSchedulingService.bookSlot(
      slotId,
      businessId,
      userId,
      inspectionType || 'INITIAL',
      notes || ''
    );
    
    res.json(result);
  } catch (err) {
    console.error('POST /api/inspections/book error:', err);
    return respond.error(res, 500, 'booking_error', err.message || 'Failed to book inspection');
  }
});

// POST /api/inspections/cancel - Cancel a booking
router.post('/cancel', requireJwt, async (req, res) => {
  try {
    const { slotId, reason } = req.body;
    const userId = req._userId;
    
    if (!slotId) {
      return respond.error(res, 400, 'slot_required', 'Slot ID is required');
    }
    
    const result = await inspectionSchedulingService.cancelBooking(
      slotId,
      userId,
      reason || 'Cancelled by user'
    );
    
    res.json(result);
  } catch (err) {
    console.error('POST /api/inspections/cancel error:', err);
    return respond.error(res, 500, 'cancel_error', err.message || 'Failed to cancel inspection');
  }
});

// POST /api/inspections/reschedule - Reschedule to a new slot
router.post('/reschedule', requireJwt, async (req, res) => {
  try {
    const { oldSlotId, newSlotId, reason } = req.body;
    const userId = req._userId;
    
    if (!oldSlotId || !newSlotId) {
      return respond.error(res, 400, 'slots_required', 'Old slot ID and new slot ID are required');
    }
    
    const result = await inspectionSchedulingService.rescheduleBooking(
      oldSlotId,
      newSlotId,
      userId,
      reason || 'Rescheduled by user'
    );
    
    res.json(result);
  } catch (err) {
    console.error('POST /api/inspections/reschedule error:', err);
    return respond.error(res, 500, 'reschedule_error', err.message || 'Failed to reschedule inspection');
  }
});

// GET /api/inspections/upcoming/:businessId - Get upcoming inspections for a business
router.get('/upcoming/:businessId', requireJwt, async (req, res) => {
  try {
    const { businessId } = req.params;
    
    const inspections = await inspectionSchedulingService.getUpcomingInspections(businessId);
    res.json({ inspections });
  } catch (err) {
    console.error('GET /api/inspections/upcoming/:businessId error:', err);
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch upcoming inspections');
  }
});

// GET /api/inspections/history/:businessId - Get inspection history
router.get('/history/:businessId', requireJwt, async (req, res) => {
  try {
    const { businessId } = req.params;
    
    const history = await inspectionSchedulingService.getInspectionHistory(businessId);
    res.json({ history });
  } catch (err) {
    console.error('GET /api/inspections/history/:businessId error:', err);
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch inspection history');
  }
});

// GET /api/inspections/prerequisites/:businessId - Check prerequisites
router.get('/prerequisites/:businessId', requireJwt, async (req, res) => {
  try {
    const { businessId } = req.params;
    
    const prerequisites = await inspectionSchedulingService.checkPrerequisites(businessId);
    res.json(prerequisites);
  } catch (err) {
    console.error('GET /api/inspections/prerequisites/:businessId error:', err);
    return respond.error(res, 500, 'check_error', err.message || 'Failed to check prerequisites');
  }
});

// POST /api/inspections/slots/create - Create inspection slots (LGU Manager only)
router.post('/slots/create', requireJwt, requireRole(['lgu_manager', 'admin']), async (req, res) => {
  try {
    const { inspectorId, date, startTimes, location } = req.body;
    
    if (!inspectorId || !date || !startTimes || !Array.isArray(startTimes)) {
      return respond.error(res, 400, 'required_fields', 'Inspector ID, date, and start times are required');
    }
    
    const slots = await inspectionSchedulingService.createSlots(
      inspectorId,
      date,
      startTimes,
      location || {}
    );
    
    res.json({
      success: true,
      slotsCreated: slots.length,
      slots: slots.map(s => ({
        slotId: s._id,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status
      }))
    });
  } catch (err) {
    console.error('POST /api/inspections/slots/create error:', err);
    return respond.error(res, 500, 'create_error', err.message || 'Failed to create inspection slots');
  }
});

// GET /api/inspections/inspector-schedule/:inspectorId - Get inspector schedule
router.get('/inspector-schedule/:inspectorId', requireJwt, requireRole(['inspector', 'lgu_manager', 'admin']), async (req, res) => {
  try {
    const { inspectorId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return respond.error(res, 400, 'dates_required', 'Start date and end date are required');
    }
    
    const schedule = await inspectionSchedulingService.getInspectorSchedule(
      inspectorId,
      startDate,
      endDate
    );
    
    res.json({ schedule });
  } catch (err) {
    console.error('GET /api/inspections/inspector-schedule/:inspectorId error:', err);
    return respond.error(res, 500, 'fetch_error', err.message || 'Failed to fetch inspector schedule');
  }
});

// POST /api/inspections/complete - Complete an inspection (Inspector only)
router.post('/complete', requireJwt, requireRole(['inspector', 'admin']), async (req, res) => {
  try {
    const { slotId, findings, status, violations, documents, notes } = req.body;
    
    if (!slotId || !status) {
      return respond.error(res, 400, 'required_fields', 'Slot ID and status are required');
    }
    
    const result = await inspectionSchedulingService.completeInspection(
      slotId,
      findings || '',
      status,
      violations || [],
      documents || [],
      notes || ''
    );
    
    res.json(result);
  } catch (err) {
    console.error('POST /api/inspections/complete error:', err);
    return respond.error(res, 500, 'complete_error', err.message || 'Failed to complete inspection');
  }
});

module.exports = router;
