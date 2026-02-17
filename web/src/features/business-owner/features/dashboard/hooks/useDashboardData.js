import { useState, useEffect } from 'react'
import { get } from '@/lib/http.js'

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch real dashboard stats from backend
        const res = await get('/api/business/dashboard/owner-stats')
        const stats = res?.data || {}

        // Transform backend response to match dashboard component expectations
        setData({
          compliance: {
            status: stats.overduePostRequirements > 0 ? 'Action Required' :
                    stats.pendingPostRequirements > 0 ? 'Action Required' : 'Compliant',
            reason: stats.overduePostRequirements > 0
              ? `${stats.overduePostRequirements} overdue post-requirement(s)`
              : stats.pendingPostRequirements > 0
                ? `${stats.pendingPostRequirements} pending post-requirement(s)`
                : 'All requirements met',
            lastValidation: new Date().toISOString(),
            verified: stats.overduePostRequirements === 0,
            riskLevel: stats.overduePostRequirements > 0 ? 'High' :
                       stats.pendingPostRequirements > 0 ? 'Medium' : 'Low',
          },
          permits: {
            active: stats.activeBusinesses || 0,
            pending: (stats.recentApplications || []).filter((a) => a.status === 'submitted' || a.status === 'under_review').length,
            expiring: stats.renewalsDue || 0,
            list: (stats.recentApplications || []).map((app, i) => ({
              id: i + 1,
              type: 'Business Permit',
              status: app.status === 'approved' ? 'Active' :
                      app.status === 'submitted' ? 'Pending' : app.status,
              expiry: '-',
              businessName: app.businessName,
            })),
          },
          payments: {
            totalOutstanding: 0,
            nearestDueDate: null,
            overdue: 0,
            lastPayment: null,
            list: [],
          },
          inspections: {
            upcoming: null,
            recentResult: null,
            openViolations: 0,
            list: [],
          },
          appeals: {
            active: stats.openAppeals || 0,
            underReview: stats.openAppeals || 0,
            decided: 0,
            list: [],
          },
          notifications: stats.renewalsDue > 0
            ? [{ id: 1, type: 'warning', message: `${stats.renewalsDue} business(es) due for renewal`, time: 'Now' }]
            : [],
          businessProfile: {
            name: stats.recentApplications?.[0]?.businessName || 'Your Business',
            regNumber: stats.recentApplications?.[0]?.businessId || '-',
            type: '-',
            riskCategory: 'Low',
            address: '-',
            status: stats.activeBusinesses > 0 ? 'Active' : 'Pending',
          },
          documents: [],
          auditTrail: [],
          aiSuggestions: [
            ...(stats.renewalsDue > 0 ? [{ id: 1, text: `${stats.renewalsDue} business(es) need renewal`, type: 'warning' }] : []),
            ...(stats.pendingPostRequirements > 0 ? [{ id: 2, text: `${stats.pendingPostRequirements} pending post-requirement(s)`, type: 'info' }] : []),
            ...(stats.openAppeals > 0 ? [{ id: 3, text: `${stats.openAppeals} open appeal(s)`, type: 'info' }] : []),
          ],
          // Raw stats for custom widgets
          _raw: stats,
        })
      } catch (err) {
        console.error('Dashboard data fetch failed, using fallback:', err)
        // Fallback to empty state
        setData({
          compliance: { status: 'Unknown', reason: 'Unable to fetch data', verified: false, riskLevel: 'Low' },
          permits: { active: 0, pending: 0, expiring: 0, list: [] },
          payments: { totalOutstanding: 0, list: [] },
          inspections: { list: [] },
          appeals: { active: 0, underReview: 0, decided: 0, list: [] },
          notifications: [],
          businessProfile: { name: '-', status: 'Unknown' },
          documents: [],
          auditTrail: [],
          aiSuggestions: [],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { loading, data }
}
