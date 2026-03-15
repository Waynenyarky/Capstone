const InspectionSlot = require('../models/InspectionSlot');
const BusinessProfile = require('../models/BusinessProfile');
const Violation = require('../models/Violation');
const { generateReferenceNumber } = require('../utils/referenceNumber');

const INSPECTION_TYPES = ['INITIAL', 'RENEWAL', 'COMPLIANCE', 'FOLLOW_UP', 'COMPLAINT'];
const SLOT_DURATION_MINUTES = 60; // Default slot duration

/**
 * Create available inspection slots for an inspector
 */
async function createSlots(inspectorId, date, startTimes, location = {}) {
  const slots = [];
  
  for (const startTime of startTimes) {
    // Parse start time and calculate end time
    const [hours, minutes] = startTime.split(':').map(Number);
    const endDate = new Date(2000, 0, 1, hours, minutes + SLOT_DURATION_MINUTES);
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    
    const slot = new InspectionSlot({
      inspectorId,
      date: new Date(date),
      startTime,
      endTime,
      status: 'AVAILABLE',
      location
    });
    
    await slot.save();
    slots.push(slot);
  }
  
  return slots;
}

/**
 * Get available slots for a date range
 */
async function getAvailableSlots(startDate, endDate, inspectorId = null, barangay = null) {
  const query = {
    status: 'AVAILABLE',
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (inspectorId) {
    query.inspectorId = inspectorId;
  }
  
  if (barangay) {
    query['location.barangay'] = barangay;
  }
  
  const slots = await InspectionSlot.find(query)
    .populate('inspectorId', 'firstName lastName email')
    .sort({ date: 1, startTime: 1 })
    .lean();
  
  return slots.map(slot => ({
    slotId: slot._id,
    inspectorId: slot.inspectorId?._id,
    inspectorName: slot.inspectorId ? `${slot.inspectorId.firstName} ${slot.inspectorId.lastName}` : null,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    duration: slot.duration,
    location: slot.location
  }));
}

/**
 * Book an inspection slot
 */
async function bookSlot(slotId, businessId, userId, inspectionType = 'INITIAL', notes = '') {
  const slot = await InspectionSlot.findById(slotId);
  
  if (!slot) {
    throw new Error('Inspection slot not found');
  }
  
  if (!slot.isAvailable()) {
    throw new Error('Slot is not available for booking');
  }
  
  // Get business details for location
  const business = await BusinessProfile.findById(businessId);
  if (!business) {
    throw new Error('Business not found');
  }
  
  // Update slot with booking
  slot.status = 'BOOKED';
  slot.booking = {
    businessId,
    bookedAt: new Date(),
    bookedBy: userId,
    inspectionType,
    notes
  };
  slot.location = {
    address: business.address,
    barangay: business.barangay,
    city: business.city,
    province: business.province
  };
  
  await slot.save();
  
  // Update business with inspection reference
  await BusinessProfile.findByIdAndUpdate(businessId, {
    $push: {
      scheduledInspections: {
        slotId: slot._id,
        inspectorId: slot.inspectorId,
        date: slot.date,
        status: 'SCHEDULED'
      }
    }
  });
  
  return {
    slotId: slot._id,
    referenceNumber: await generateReferenceNumber('INS'),
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    inspectorName: slot.inspectorId
  };
}

/**
 * Cancel a booking
 */
async function cancelBooking(slotId, userId, reason, allowReschedule = true) {
  const slot = await InspectionSlot.findById(slotId);
  
  if (!slot) {
    throw new Error('Inspection slot not found');
  }
  
  if (slot.status !== 'BOOKED') {
    throw new Error('Cannot cancel slot - not currently booked');
  }
  
  if (!slot.canCancel()) {
    throw new Error('Cannot cancel - less than 24 hours before inspection');
  }
  
  slot.status = 'AVAILABLE';
  slot.cancellation = {
    cancelledAt: new Date(),
    cancelledBy: userId,
    reason,
    isRescheduled: false
  };
  
  // Clear booking
  const businessId = slot.booking.businessId;
  slot.booking = undefined;
  
  await slot.save();
  
  // Update business record
  if (businessId) {
    await BusinessProfile.findByIdAndUpdate(businessId, {
      $pull: {
        scheduledInspections: { slotId: slot._id }
      }
    });
  }
  
  return { success: true, slotId };
}

/**
 * Reschedule to a new slot
 */
async function rescheduleBooking(oldSlotId, newSlotId, userId, reason) {
  // Cancel old slot
  const cancelResult = await cancelBooking(oldSlotId, userId, reason, true);
  
  // Get old slot details to preserve booking info
  const oldSlot = await InspectionSlot.findById(oldSlotId);
  
  // Book new slot
  const bookingResult = await bookSlot(
    newSlotId,
    oldSlot.booking?.businessId,
    userId,
    oldSlot.booking?.inspectionType,
    `Rescheduled from ${oldSlot.date.toDateString()}. Reason: ${reason}`
  );
  
  // Update cancellation with reschedule info
  await InspectionSlot.findByIdAndUpdate(oldSlotId, {
    'cancellation.isRescheduled': true,
    'cancellation.newSlotId': newSlotId
  });
  
  return {
    oldSlotId,
    newSlotId,
    referenceNumber: bookingResult.referenceNumber,
    newDate: bookingResult.date,
    newTime: `${bookingResult.startTime} - ${bookingResult.endTime}`
  };
}

/**
 * Get upcoming inspections for a business
 */
async function getUpcomingInspections(businessId) {
  const slots = await InspectionSlot.find({
    'booking.businessId': businessId,
    status: 'BOOKED',
    date: { $gte: new Date() }
  })
    .populate('inspectorId', 'firstName lastName email phone')
    .sort({ date: 1, startTime: 1 })
    .lean();
  
  return slots.map(slot => ({
    slotId: slot._id,
    referenceNumber: slot.booking?.referenceNumber,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    inspectionType: slot.booking?.inspectionType,
    inspector: slot.inspectorId,
    notes: slot.booking?.notes,
    location: slot.location,
    canCancel: slot.canCancel()
  }));
}

/**
 * Get inspection history for a business
 */
async function getInspectionHistory(businessId) {
  const slots = await InspectionSlot.find({
    'booking.businessId': businessId,
    status: { $in: ['COMPLETED', 'CANCELLED'] }
  })
    .populate('inspectorId', 'firstName lastName')
    .populate('completion.violations')
    .sort({ date: -1 })
    .lean();
  
  return slots.map(slot => ({
    slotId: slot._id,
    date: slot.date,
    status: slot.status,
    inspectionType: slot.booking?.inspectionType,
    completion: slot.completion,
    cancellation: slot.cancellation,
    inspector: slot.inspectorId
  }));
}

/**
 * Complete an inspection (inspector use)
 */
async function completeInspection(slotId, findings, status, violations = [], documents = [], notes = '') {
  const slot = await InspectionSlot.findById(slotId);
  
  if (!slot) {
    throw new Error('Inspection slot not found');
  }
  
  if (slot.status !== 'BOOKED') {
    throw new Error('Cannot complete - slot is not booked');
  }
  
  // Create violations if any
  const violationIds = [];
  for (const violationData of violations) {
    const violation = new Violation({
      businessId: slot.booking.businessId,
      inspectionId: slot._id,
      type: violationData.type,
      description: violationData.description,
      severity: violationData.severity || 'MINOR',
      issuedBy: slot.inspectorId,
      issuedAt: new Date(),
      deadline: violationData.deadline,
      status: 'PENDING'
    });
    await violation.save();
    violationIds.push(violation._id);
  }
  
  slot.status = 'COMPLETED';
  slot.completion = {
    completedAt: new Date(),
    findings,
    status,
    violations: violationIds,
    documents: documents.map(url => ({
      type: url,
      uploadedAt: new Date()
    })),
    notes
  };
  
  await slot.save();
  
  // Update business with inspection result
  await BusinessProfile.findByIdAndUpdate(slot.booking.businessId, {
    $push: {
      inspectionHistory: {
        slotId: slot._id,
        date: slot.date,
        status,
        violations: violationIds,
        completedAt: new Date()
      }
    },
    lastInspectionDate: new Date(),
    lastInspectionStatus: status
  });
  
  return {
    slotId: slot._id,
    status: 'COMPLETED',
    completionStatus: status,
    violationsCreated: violationIds.length
  };
}

/**
 * Get inspector schedule
 */
async function getInspectorSchedule(inspectorId, startDate, endDate) {
  const slots = await InspectionSlot.find({
    inspectorId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  })
    .populate('booking.businessId', 'businessName address')
    .sort({ date: 1, startTime: 1 })
    .lean();
  
  return slots.map(slot => ({
    slotId: slot._id,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    status: slot.status,
    business: slot.booking?.businessId,
    inspectionType: slot.booking?.inspectionType,
    location: slot.location,
    completion: slot.completion
  }));
}

/**
 * Check prerequisites for scheduling
 */
async function checkPrerequisites(businessId) {
  const business = await BusinessProfile.findById(businessId);
  
  if (!business) {
    throw new Error('Business not found');
  }
  
  const prerequisites = {
    hasClearances: ['clearance_complete', 'approved', 'active'].includes(business.applicationStatus),
    hasPaidFees: business.payments?.some(p => p.status === 'paid'),
    noOutstandingViolations: true, // Would check violations collection
    hasValidPermit: business.permitStatus === 'active' || business.applicationStatus === 'approved'
  };
  
  const canSchedule = Object.values(prerequisites).every(p => p === true);
  
  return {
    canSchedule,
    prerequisites,
    missingRequirements: Object.entries(prerequisites)
      .filter(([_, met]) => !met)
      .map(([req]) => req)
  };
}

/**
 * Send inspection reminders
 */
async function sendReminders() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  
  // Find inspections scheduled for tomorrow
  const slots = await InspectionSlot.find({
    status: 'BOOKED',
    date: {
      $gte: tomorrow,
      $lt: dayAfter
    }
  }).populate('booking.businessId', 'userId businessName')
    .populate('inspectorId', 'firstName lastName');
  
  for (const slot of slots) {
    // Check if reminder already sent
    const emailReminderSent = slot.remindersSent?.some(r => r.type === 'EMAIL');
    
    if (!emailReminderSent) {
      // Send email reminder (mock - integrate with email service)
      console.log(`Sending reminder for inspection ${slot._id}`);
      
      slot.remindersSent.push({
        type: 'EMAIL',
        sentAt: new Date(),
        status: 'SENT'
      });
      
      await slot.save();
    }
  }
  
  return { remindersSent: slots.length };
}

module.exports = {
  createSlots,
  getAvailableSlots,
  bookSlot,
  cancelBooking,
  rescheduleBooking,
  getUpcomingInspections,
  getInspectionHistory,
  completeInspection,
  getInspectorSchedule,
  checkPrerequisites,
  sendReminders,
  INSPECTION_TYPES,
  SLOT_DURATION_MINUTES
};
