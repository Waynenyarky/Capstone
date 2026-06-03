import { Typography, Button, theme } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'

const { Text } = Typography

export default function FinanceFeeConfigTab() {
  const { token } = theme.useToken()

  return (
    <div style={{ padding: 24, maxWidth: 560, margin: '0 auto' }}>
      <Text style={{ display: 'block', marginBottom: 12 }}>
        Fee configuration defines line-of-business fees, special fees, and penalty & surcharge rules
        used for permit registration and renewal assessments.
      </Text>
      <Link to="/admin/fee-configuration">
        <Button type="primary" icon={<SettingOutlined />}>
          Manage fee configuration
        </Button>
      </Link>
    </div>
  )
}
