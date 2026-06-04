import { Typography, Button } from 'antd'

const { Text } = Typography

export default function SidebarHeader({ roleName, currentUser, onLogout }) {
  return (
    <div style={{ padding: 12 }}>
      <Text strong>{roleName}</Text>
      {currentUser?.email && (
        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
          {currentUser.email}
        </Text>
      )}
      <div style={{ marginTop: 8 }}>
        <Button size="small" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </div>
  )
}
