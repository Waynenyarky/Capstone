import React from 'react'
import { Card, List, Tag, Button, Space, Tooltip, Empty, theme } from 'antd'
import { FolderOpenOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const Documents = ({ data }) => {
  if (!data) return null
  const { token } = theme.useToken()
  const navigate = useNavigate()

  return (
    <Card 
      title={<Space><FolderOpenOutlined style={{ color: token.colorPrimary }} /> Recent Documents</Space>}
      extra={<Button type="link" size="small" onClick={() => navigate('/owner/businesses')}>All Files</Button>}
      style={{ height: '100%', boxShadow: token.boxShadowSecondary, borderRadius: token.borderRadiusLG }}
    >
      {(data || []).length === 0 ? (
        <Empty description="No documents available" style={{ padding: 24 }} />
      ) : (
        <List
          dataSource={data}
          renderItem={item => (
            <List.Item
              actions={[
                <Tooltip title="View"><Button type="text" icon={<EyeOutlined />} size="small" onClick={() => navigate('/owner/businesses')} /></Tooltip>,
                <Tooltip title="Download"><Button type="text" icon={<DownloadOutlined />} size="small" /></Tooltip>
              ]}
            >
              <List.Item.Meta
                title={item.name}
                description={
                  <Space>
                     <Tag>{item.type}</Tag>
                     <Tag color={item.status === 'Verified' ? 'green' : item.status === 'Expired' ? 'red' : token.colorWarning}>
                       {item.status}
                     </Tag>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}

export default Documents
