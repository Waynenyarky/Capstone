import { Collapse, Table, Space, Typography } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'
import { formatDate } from './utils/formatters'

const { Text } = Typography

export default function ApplicationHistory({ applicationHistory }) {
  return (
    <Collapse
      style={{ marginBottom: 16 }}
      items={[{
        key: 'history',
        label: <Space><HistoryOutlined /><Text strong>Application History & Audit Trail</Text></Space>,
        children: (
          <Table
            dataSource={applicationHistory.map((ev, index) => ({
              key: index,
              date: formatDate(ev.at),
              user: ev.user || ev.officer || ev.actor || 'System',
              action: ev.label || ev.event || ev.action || 'Unknown',
              details: ev.details || ev.description || '',
              files: ev.files || ev.documents || []
            }))}
            columns={[
              {
                title: 'Date',
                dataIndex: 'date',
                key: 'date',
                width: 150,
              },
              {
                title: 'User',
                dataIndex: 'user',
                key: 'user',
                width: 120,
              },
              {
                title: 'Action',
                dataIndex: 'action',
                key: 'action',
                width: 200,
              },
              {
                title: 'Details',
                dataIndex: 'details',
                key: 'details',
                render: (details) => details ? <Text type="secondary">{details}</Text> : '-'
              },
              {
                title: 'Files',
                dataIndex: 'files',
                key: 'files',
                width: 100,
                render: (files) => {
                  if (!files || files.length === 0) return '-'
                  return (
                    <Space direction="vertical" size="small">
                      {files.map((file, idx) => (
                        <div key={idx}>
                          <Text code style={{ fontSize: 11 }}>{file.name || file.fileName || 'Document'}</Text>
                          {file.cid && (
                            <div>
                              <Text type="secondary" style={{ fontSize: 10 }}>CID: {file.cid}</Text>
                            </div>
                          )}
                        </div>
                      ))}
                    </Space>
                  )
                }
              }
            ]}
            size="small"
            pagination={false}
            scroll={{ x: 800 }}
          />
        ),
      }]}
    />
  )
}
