import { useState, useEffect } from 'react'

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    // Simulate API fetch
    const fetchData = async () => {
      setLoading(true)
      // Mock delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Mock Data
      setData({
        compliance: {
          status: 'Action Required', // Compliant / Action Required / Non-Compliant
          reason: 'Fire Safety Certificate expired',
          lastValidation: '2023-10-15T14:30:00Z',
          verified: true,
          riskLevel: 'High' // Low / Medium / High
        },
        permits: {
          active: 3,
          pending: 1,
          expiring: 2,
          list: [
            { id: 1, type: 'Mayor\'s Permit', status: 'Active', expiry: '2024-01-20' },
            { id: 2, type: 'Sanitary Permit', status: 'Expiring Soon', expiry: '2023-11-30' },
            { id: 3, type: 'Fire Safety', status: 'Expired', expiry: '2023-10-15' },
          ]
        },
        payments: {
          totalOutstanding: 5400.00,
          nearestDueDate: '2023-11-30',
          overdue: 1,
          lastPayment: '2023-09-01',
          list: [
            { id: 101, invoice: 'INV-2023-001', type: 'Renewal Fee', amount: 4500.00, status: 'Unpaid' },
            { id: 102, invoice: 'INV-2023-002', type: 'Penalty', amount: 900.00, status: 'Overdue' },
          ]
        },
        inspections: {
          upcoming: { date: '2023-11-05', inspector: 'Bureau of Fire Protection' },
          recentResult: 'Failed', // Passed / Failed / Conditional
          openViolations: 2,
          list: [
            { id: 1, date: '2023-10-15', finding: 'Blocked fire exit', status: 'Open' },
            { id: 2, date: '2023-01-20', finding: 'Sanitary compliance', status: 'Resolved' },
          ]
        },
        appeals: {
          active: 1,
          underReview: 1,
          decided: 0,
          list: [
            { id: 1, refNo: 'APP-2023-88', type: 'Closure Order', status: 'Under Review' }
          ]
        },
        notifications: [
          { id: 1, type: 'critical', message: 'Fire Safety Certificate expired', time: '2 days ago' },
          { id: 2, type: 'info', message: 'Inspection scheduled for Nov 5', time: '1 day ago' },
          { id: 3, type: 'info', message: 'New ordinance on signage', time: '1 week ago' },
        ],
        businessProfile: {
          name: 'TechSolutions Inc.',
          regNumber: 'BP-2023-9999',
          type: 'Corporation',
          riskCategory: 'Low',
          address: '123 Innovation Drive, Tech City',
          status: 'Active'
        },
        documents: [
          { id: 1, name: 'Mayor\'s Permit 2023', type: 'Permit', status: 'Verified' },
          { id: 2, name: 'Fire Safety Cert', type: 'Certificate', status: 'Expired' },
          { id: 3, name: 'Sanitary Permit', type: 'Permit', status: 'Pending Review' },
        ],
        auditTrail: [
          { id: 1, timestamp: '2023-10-25 10:00 AM', action: 'Permit submitted', actor: 'Business Owner' },
          { id: 2, timestamp: '2023-10-24 02:30 PM', action: 'Payment confirmed', actor: 'System' },
          { id: 3, timestamp: '2023-10-20 09:15 AM', action: 'Inspection completed', actor: 'LGU Inspector' },
        ],
        aiSuggestions: [
          { id: 1, text: 'Your Mayor\'s Permit expires in 14 days', type: 'warning' },
          { id: 2, text: 'High-risk category: inspection likely', type: 'info' },
          { id: 3, text: 'Missing Fire Safety Certificate', type: 'error' },
        ]
      })
      setLoading(false)
    }

    fetchData()
  }, [])

  return { loading, data }
}
