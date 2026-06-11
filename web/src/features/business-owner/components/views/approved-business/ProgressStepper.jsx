import { CheckCircleOutlined, DollarOutlined, DownloadOutlined, SearchOutlined, FileDoneOutlined } from '@ant-design/icons'
import { Steps } from 'antd'

export default function ProgressStepper({ stepStatuses, currentStep, business, payments }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // Get the latest payment date from paid payments
  const getLatestPaymentDate = () => {
    if (!payments || !Array.isArray(payments)) return null
    const paidPayments = payments.filter(p => p.status === 'paid' && p.paidAt)
    if (paidPayments.length === 0) return null
    // Sort by paidAt date descending and get the most recent
    return paidPayments.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))[0].paidAt
  }

  const items = [
    { 
      title: 'Approved Application', 
      description: business?.reviewedAt ? `Approved on ${formatDate(business.reviewedAt)}` : 'Application approved',
      icon: <CheckCircleOutlined /> 
    },
    { 
      title: 'Payment Status', 
      description: stepStatuses[1] === 'finish' ? `Paid on ${formatDate(getLatestPaymentDate())}` : stepStatuses[1] === 'process' ? 'Payment pending' : 'Payment pending',
      icon: <DollarOutlined /> 
    },
    { 
      title: 'Download Permit', 
      description: stepStatuses[2] === 'finish' ? 'Permit downloaded' : stepStatuses[2] === 'process' ? 'Ready for download' : 'Awaiting payment completion',
      icon: <DownloadOutlined /> 
    },
    { 
      title: 'Inspection Status', 
      description: stepStatuses[3] === 'finish' ? 'Inspection completed' : stepStatuses[3] === 'process' ? 'Inspection pending' : 'No inspection scheduled',
      icon: <SearchOutlined /> 
    },
    { 
      title: 'Post-Requirements', 
      description: stepStatuses[4] === 'finish' ? 'All requirements completed' : stepStatuses[4] === 'process' ? 'With deadline' : 'No requirements yet',
      icon: <FileDoneOutlined /> 
    },
  ]

  return (
    <Steps
      direction="vertical"
      current={currentStep}
      size="small"
      items={items.map((item, i) => ({
        ...item,
        status: stepStatuses[i],
      }))}
      style={{ marginBottom: 0, padding: 16 }}
    />
  )
}
