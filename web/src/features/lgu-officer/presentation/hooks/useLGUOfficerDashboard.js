/**
 * Presentation Hook: useLGUOfficerDashboard
 * Controller for LGU Officer Dashboard
 * Connects UI to use cases
 */
import { useState, useEffect, useMemo } from 'react'
import { InspectionService, ViolationService, PermitApplicationService } from '../../infrastructure/services'
import { useNotifier } from '@/shared/notifications.js'

export function useLGUOfficerDashboard() {
  const { success, error } = useNotifier()
  const [loading, setLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState(null)

  // Initialize repositories
  const inspectionRepo = useMemo(() => new InspectionService(), [])
  const violationRepo = useMemo(() => new ViolationService(), [])
  const permitAppRepo = useMemo(() => new PermitApplicationService(), [])

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true)
      try {
        const [inspections, violations, pendingApplications] = await Promise.all([
          inspectionRepo.getInspections({ filters: { status: 'scheduled' }, pagination: { page: 1, limit: 5 } }),
          violationRepo.getViolations({ filters: { status: 'active' }, pagination: { page: 1, limit: 5 } }),
          permitAppRepo.getPendingApplications()
        ])

        setDashboardData({
          scheduledInspections: inspections?.inspections || [],
          activeViolations: violations?.violations || [],
          pendingApplications: pendingApplications?.applications || []
        })
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [inspectionRepo, violationRepo, permitAppRepo, error])

  return {
    loading,
    dashboardData
  }
}
