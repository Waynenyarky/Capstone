import { useState, useCallback, useEffect, useMemo } from 'react'
import { message } from 'antd'
import {
  getInspectors,
  getBusinessesForInspection,
  getInspections,
  createInspection,
  rescheduleInspection,
} from '../../infrastructure/services/inspectionAssignmentService'

export default function useAssignInspectionPage() {
  const [tabKey, setTabKey] = useState('calendar')
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Data
  const [inspectors, setInspectors] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [allInspections, setAllInspections] = useState([])

  // Derived lists
  const pendingInspections = useMemo(
    () => allInspections.filter((i) => i.status === 'pending'),
    [allInspections]
  )
  const inProgressInspections = useMemo(
    () => allInspections.filter((i) => i.status === 'in_progress'),
    [allInspections]
  )
  const completedInspections = useMemo(
    () => allInspections.filter((i) => i.status === 'completed'),
    [allInspections]
  )
  // Appointments = pending + in_progress (all non-completed assigned inspections)
  const appointments = useMemo(
    () => allInspections.filter((i) => i.status !== 'completed'),
    [allInspections]
  )

  // Businesses that are approved but don't have a pending/in_progress inspection yet
  const unassignedBusinesses = useMemo(() => {
    const assignedBizIds = new Set(
      allInspections
        .filter((i) => i.status !== 'completed')
        .map((i) => `${i.businessProfileId}::${i.businessId}`)
    )
    return businesses.filter(
      (b) => !assignedBizIds.has(`${b.businessProfileId}::${b.businessId}`)
    )
  }, [businesses, allInspections])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [inspList, bizList, inspRes] = await Promise.all([
        getInspectors(),
        getBusinessesForInspection(),
        getInspections({ limit: 500 }),
      ])
      setInspectors(inspList)
      setBusinesses(bizList)
      setAllInspections(inspRes?.inspections || [])
      setLastUpdated(new Date())
    } catch (e) {
      message.error(e?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateInspection = useCallback(
    async (values) => {
      try {
        await createInspection(values)
        message.success('Inspection assigned successfully')
        await loadData()
        return true
      } catch (e) {
        message.error(e?.message || 'Failed to assign inspection')
        return false
      }
    },
    [loadData]
  )

  const handleReschedule = useCallback(
    async (id, payload) => {
      try {
        await rescheduleInspection(id, payload)
        message.success('Inspection rescheduled successfully')
        await loadData()
        return true
      } catch (e) {
        message.error(e?.message || 'Failed to reschedule inspection')
        return false
      }
    },
    [loadData]
  )

  return {
    tabKey,
    setTabKey,
    loading,
    lastUpdated,
    loadData,
    inspectors,
    businesses,
    allInspections,
    pendingInspections,
    inProgressInspections,
    completedInspections,
    appointments,
    unassignedBusinesses,
    handleCreateInspection,
    handleReschedule,
  }
}
