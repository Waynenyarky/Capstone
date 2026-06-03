import { Typography, Empty } from 'antd'

const { Text } = Typography

export default function ApplicationProcessPlaceholder() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Empty
        description={
          <Text type="secondary">
            Application Processes management is coming soon.
          </Text>
        }
      />
    </div>
  )
}
