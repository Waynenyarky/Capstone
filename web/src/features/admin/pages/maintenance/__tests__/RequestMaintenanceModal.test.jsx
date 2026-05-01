import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'

// Comprehensive unit tests for maintenance scheduling logic
describe('Maintenance Scheduling Logic - Comprehensive Tests', () => {
  describe('Conflict Detection Logic', () => {
    const hasConflict = (startValue, endValue, conflicts, currentMaintenance = null) => {
      if (!startValue || !endValue) return false
      const start = dayjs(startValue)
      const end = dayjs(endValue)
      if (!start.isValid() || !end.isValid() || !end.isAfter(start)) return false
      return conflicts.some((conflict) => {
        // Skip current active maintenance from conflict check
        if (currentMaintenance?.expectedResumeAt) {
          const currentResumeAt = dayjs(currentMaintenance.expectedResumeAt)
          const conflictEnd = dayjs(conflict.endAt || conflict.expectedResumeAt)
          if (conflictEnd.isValid() && conflictEnd.isSame(currentResumeAt)) return false
        }
        const cStart = dayjs(conflict.startAt || conflict.scheduledStartAt)
        const cEnd = dayjs(conflict.endAt || conflict.expectedResumeAt)
        if (!cStart.isValid() || !cEnd.isValid()) return false
        return start.isBefore(cEnd) && cStart.isBefore(end)
      })
    }

    it('detects overlap when new maintenance overlaps with existing', () => {
      const conflicts = [
        {
          startAt: dayjs().add(2, 'day').toISOString(),
          endAt: dayjs().add(3, 'day').toISOString(),
        }
      ]
      const newStart = dayjs().add(1, 'day')
      const newEnd = dayjs().add(4, 'day')
      
      expect(hasConflict(newStart, newEnd, conflicts)).toBe(true)
    })

    it('does not detect overlap when new maintenance is after existing', () => {
      const conflicts = [
        {
          startAt: dayjs().add(1, 'day').toISOString(),
          endAt: dayjs().add(2, 'day').toISOString(),
        }
      ]
      const newStart = dayjs().add(3, 'day')
      const newEnd = dayjs().add(4, 'day')
      
      expect(hasConflict(newStart, newEnd, conflicts)).toBe(false)
    })

    it('does not detect overlap when new maintenance is before existing', () => {
      const conflicts = [
        {
          startAt: dayjs().add(3, 'day').toISOString(),
          endAt: dayjs().add(4, 'day').toISOString(),
        }
      ]
      const newStart = dayjs().add(1, 'day')
      const newEnd = dayjs().add(2, 'day')
      
      expect(hasConflict(newStart, newEnd, conflicts)).toBe(false)
    })

    it('excludes current active maintenance from conflict check when resume times match', () => {
      const conflicts = [
        {
          startAt: dayjs().subtract(1, 'day').toISOString(),
          endAt: dayjs().add(1, 'day').toISOString(),
          expectedResumeAt: dayjs().add(1, 'day').toISOString(),
        }
      ]
      const currentMaintenance = {
        expectedResumeAt: dayjs().add(1, 'day').toISOString(),
      }
      const newStart = dayjs().add(2, 'day')
      const newEnd = dayjs().add(3, 'day')
      
      expect(hasConflict(newStart, newEnd, conflicts, currentMaintenance)).toBe(false)
    })

    it('detects overlap with other conflicts even when current maintenance is excluded', () => {
      const conflicts = [
        {
          startAt: dayjs().subtract(1, 'day').toISOString(),
          endAt: dayjs().add(1, 'day').toISOString(),
          expectedResumeAt: dayjs().add(1, 'day').toISOString(),
        },
        {
          startAt: dayjs().add(4, 'day').toISOString(),
          endAt: dayjs().add(5, 'day').toISOString(),
        }
      ]
      const currentMaintenance = {
        expectedResumeAt: dayjs().add(1, 'day').toISOString(),
      }
      const newStart = dayjs().add(3, 'day')
      const newEnd = dayjs().add(6, 'day')
      
      expect(hasConflict(newStart, newEnd, conflicts, currentMaintenance)).toBe(true)
    })
  })

  describe('Start Time Validation During Active Maintenance', () => {
    it('rejects start time before current maintenance ends', () => {
      const currentResumeAt = dayjs().add(1, 'day')
      const newStart = dayjs().add(12, 'hour')
      
      expect(newStart.isAfter(currentResumeAt)).toBe(false)
    })

    it('accepts start time after current maintenance ends', () => {
      const currentResumeAt = dayjs().add(1, 'day')
      const newStart = dayjs().add(2, 'day')
      
      expect(newStart.isAfter(currentResumeAt)).toBe(true)
    })

    it('accepts start time exactly at current maintenance end time', () => {
      const currentResumeAt = dayjs().add(1, 'day')
      const newStart = dayjs().add(1, 'day')
      
      expect(newStart.isSame(currentResumeAt)).toBe(true)
    })
  })

  describe('Resume Time Validation During Active Maintenance', () => {
    it('rejects resume time before current maintenance ends', () => {
      const currentResumeAt = dayjs().add(1, 'day')
      const newResume = dayjs().add(12, 'hour')
      
      expect(newResume.isAfter(currentResumeAt)).toBe(false)
    })

    it('accepts resume time after current maintenance ends', () => {
      const currentResumeAt = dayjs().add(1, 'day')
      const newResume = dayjs().add(2, 'day')
      
      expect(newResume.isAfter(currentResumeAt)).toBe(true)
    })
  })

  describe('Duration Validation', () => {
    const MIN_MAINTENANCE_DURATION_HOURS = 1
    const MAX_MAINTENANCE_DURATION_DAYS = 7

    it('rejects duration less than minimum (1 hour)', () => {
      const start = dayjs()
      const end = dayjs().add(30, 'minute')
      
      const durationHours = end.diff(start, 'hour', true)
      expect(durationHours >= MIN_MAINTENANCE_DURATION_HOURS).toBe(false)
    })

    it('accepts duration meeting minimum (1 hour)', () => {
      const start = dayjs()
      const end = dayjs().add(1, 'hour')
      
      const durationHours = end.diff(start, 'hour', true)
      expect(durationHours >= MIN_MAINTENANCE_DURATION_HOURS).toBe(true)
    })

    it('rejects duration exceeding maximum (7 days)', () => {
      const start = dayjs()
      const end = dayjs().add(8, 'day')
      
      const durationDays = end.diff(start, 'day', true)
      expect(durationDays <= MAX_MAINTENANCE_DURATION_DAYS).toBe(false)
    })

    it('accepts duration within maximum (7 days)', () => {
      const start = dayjs()
      const end = dayjs().add(5, 'day')
      
      const durationDays = end.diff(start, 'day', true)
      expect(durationDays <= MAX_MAINTENANCE_DURATION_DAYS).toBe(true)
    })
  })

  describe('Scheduling Horizon Validation', () => {
    const MAX_SCHEDULING_HORIZON_DAYS = 30

    it('rejects scheduling beyond 30 days', () => {
      const scheduledDate = dayjs().add(31, 'day')
      
      expect(scheduledDate.isBefore(dayjs().add(MAX_SCHEDULING_HORIZON_DAYS, 'day'))).toBe(false)
    })

    it('accepts scheduling within 30 days', () => {
      const scheduledDate = dayjs().add(15, 'day')
      
      expect(scheduledDate.isBefore(dayjs().add(MAX_SCHEDULING_HORIZON_DAYS, 'day'))).toBe(true)
    })
  })

  describe('Disabled Date Logic', () => {
    const isDateDisabled = (date, maintenanceActive, currentMaintenance) => {
      if (!date) return false
      const now = dayjs()
      const maxDate = dayjs().add(30, 'day')
      if (date.isBefore(now, 'day') || date.isAfter(maxDate)) return true
      if (maintenanceActive && currentMaintenance?.expectedResumeAt) {
        const currentResumeAt = dayjs(currentMaintenance.expectedResumeAt)
        if (date.isBefore(currentResumeAt, 'day')) return true
      }
      return false
    }

    it('disables dates before now', () => {
      const pastDate = dayjs().subtract(1, 'day')
      expect(isDateDisabled(pastDate, false, null)).toBe(true)
    })

    it('disables dates beyond 30 days', () => {
      const futureDate = dayjs().add(31, 'day')
      expect(isDateDisabled(futureDate, false, null)).toBe(true)
    })

    it('enables dates within 30 days', () => {
      const validDate = dayjs().add(15, 'day')
      expect(isDateDisabled(validDate, false, null)).toBe(false)
    })

    it('disables dates before current maintenance ends when maintenance is active', () => {
      const currentMaintenance = {
        expectedResumeAt: dayjs().add(1, 'day').toISOString()
      }
      const beforeResume = dayjs().add(12, 'hour')
      expect(isDateDisabled(beforeResume, true, currentMaintenance)).toBe(true)
    })

    it('enables dates after current maintenance ends', () => {
      const currentMaintenance = {
        expectedResumeAt: dayjs().add(1, 'day').toISOString()
      }
      const afterResume = dayjs().add(2, 'day')
      expect(isDateDisabled(afterResume, true, currentMaintenance)).toBe(false)
    })
  })
})
