import React from 'react'
import { Card, List, Tag, Button, Space, Tooltip } from 'antd'
import { FolderOpenOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons'

const Documents = ({ data }) => {
  if (!data) return null

  return (
    <Card 
      title={<Space><FolderOpenOutlined /> Recent Documents</Space>}
      extra={<Button type="link" size="small">All Files</Button>}
      style={{ height: '100%' }}
    >
      <List
        dataSource={data}
        renderItem={item => (
          <List.Item
            actions={[
              <Tooltip title="View"><Button type="text" icon={<EyeOutlined />} size="small" /></Tooltip>,
              <Tooltip title="Download"><Button type="text" icon={<DownloadOutlined />} size="small" /></Tooltip>
            ]}
          >
            <List.Item.Meta
              title={item.name}
              description={
                <Space>
                   <Tag>{item.type}</Tag>
                   <Tag color={item.status === 'Verified' ? 'green' : item.status === 'Expired' ? 'red' : 'orange'}>
                     {item.status}
                   </Tag>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  )
}

export default Documents
