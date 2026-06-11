import { Alert } from 'antd'
import { DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { formatCurrency } from '../../../utils/formatters.js'

export default function ActiveActionCard({ nextAction, token }) {
  if (!nextAction) return null

  const configs = {
    payment: {
      type: 'warning',
      icon: <DollarOutlined style={{ fontSize: 20 }} />,
      title: `You have ${nextAction.count} pending payment${nextAction.count > 1 ? 's' : ''} totalling ${formatCurrency(nextAction.total)}`,
      description: 'Settle all outstanding fees to proceed with your permit issuance.',
    },
    permit_pending: {
      type: 'success',
      icon: <CheckCircleOutlined style={{ fontSize: 20 }} />,
      title: 'Payment complete — permit ready for download',
      description: 'Your permit is now available. Go to the Permit section to download it.',
    },
    inspection_pending: {
      type: 'info',
      icon: <ClockCircleOutlined style={{ fontSize: 20 }} />,
      title: 'Permit downloaded — awaiting inspection',
      description: 'An inspector will be assigned to verify your business. You will be notified when scheduled.',
    },
    post_requirements: {
      type: nextAction.overdue > 0 ? 'error' : 'warning',
      icon: <ExclamationCircleOutlined style={{ fontSize: 20 }} />,
      title: `${nextAction.pending} post-requirement${nextAction.pending > 1 ? 's' : ''} to fulfill${nextAction.overdue > 0 ? ` (${nextAction.overdue} overdue)` : ''}`,
      description: 'Submit compliance documents before the due date to avoid permit suspension.',
    },
    good_standing: {
      type: 'success',
      icon: <CheckCircleOutlined style={{ fontSize: 20 }} />,
      title: 'Your business is in good standing',
      description: 'All requirements are fulfilled. Your permit is active.',
    },
    awaiting_assessment: {
      type: 'info',
      icon: <InfoCircleOutlined style={{ fontSize: 20 }} />,
      title: 'Awaiting fee assessment',
      description: 'The CBPLO is preparing your Tax Order of Payment. You will be notified when fees are ready.',
    },
  }

  const config = configs[nextAction.type]
  if (!config) return null

  return (
    <Alert
      type={config.type}
      showIcon
      icon={config.icon}
      message={config.title}
      description={config.description}
      style={{ borderRadius: token.borderRadiusLG }}
    />
  )
}
