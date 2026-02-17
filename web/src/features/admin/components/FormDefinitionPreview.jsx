import React from 'react'
import {
  Card,
  Typography,
  List,
  Checkbox,
  Space,
  Tag,
  Button,
  Divider,
  Empty,
  Alert,
} from 'antd'
import {
  CheckCircleOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileOutlined,
} from '@ant-design/icons'
import { getBusinessTypeLabel } from '@/constants/businessTypes'

const { Title, Text, Paragraph } = Typography

const FILE_ICONS = {
  pdf: <FilePdfOutlined />,
  doc: <FileWordOutlined />,
  docx: <FileWordOutlined />,
  xls: <FileExcelOutlined />,
  xlsx: <FileExcelOutlined />,
}

export default function FormDefinitionPreview({ definition }) {
  if (!definition) {
    return <Empty description="No definition to preview" />
  }

  const { sections = [], downloads = [], businessTypes = [], lguCodes = [] } = definition

  const getFileIcon = (fileType) => {
    return FILE_ICONS[fileType?.toLowerCase()] || <FileOutlined />
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Alert
        message="Preview Mode"
        description="This is how the requirements will appear to business owners."
        type="info"
        showIcon
      />

      {/* Targeting info */}
      {(businessTypes.length > 0 || lguCodes.length > 0) && (
        <Card size="small" title="Applies To">
          {businessTypes.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <Text strong>Business Types: </Text>
              <Space size={4} wrap>
                {businessTypes.map((type) => (
                  <Tag key={type}>{getBusinessTypeLabel(type)}</Tag>
                ))}
              </Space>
            </div>
          )}
          {lguCodes.length > 0 && (
            <div>
              <Text strong>LGUs: </Text>
              <Space size={4} wrap>
                {lguCodes.map((code) => (
                  <Tag key={code}>{code}</Tag>
                ))}
              </Space>
            </div>
          )}
        </Card>
      )}

      {/* Requirements sections */}
      {sections.length === 0 ? (
        <Empty description="No requirements defined" />
      ) : (
        <div>
          <Title level={4}>Requirements Checklist</Title>
          <Paragraph type="secondary">
            Please prepare the following documents before proceeding with your application.
          </Paragraph>

          {sections.map((section, sectionIndex) => (
            <Card
              key={sectionIndex}
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span>{section.category}</span>
                </Space>
              }
              size="small"
              style={{ marginBottom: 16 }}
            >
              {section.source && (
                <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
                  Source: {section.source}
                </Text>
              )}
              {section.notes && (
                <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
                  {section.notes}
                </Paragraph>
              )}
              <List
                size="small"
                dataSource={section.items || []}
                renderItem={(item) => (
                  <List.Item style={{ padding: '8px 0' }}>
                    <Space align="start">
                      <Checkbox disabled />
                      <div>
                        <Text>{item.label}</Text>
                        {item.required === false && (
                          <Tag color="default" style={{ marginLeft: 8 }}>
                            Optional
                          </Tag>
                        )}
                        {item.notes && (
                          <Text
                            type="secondary"
                            style={{ display: 'block', fontSize: 12, marginTop: 2 }}
                          >
                            {item.notes}
                          </Text>
                        )}
                      </div>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          ))}
        </div>
      )}

      {/* Downloads section */}
      {downloads.length > 0 && (
        <div>
          <Divider />
          <Title level={4}>Downloadable Forms</Title>
          <Paragraph type="secondary">
            Download and fill out these forms as part of your application.
          </Paragraph>
          <Space direction="vertical" style={{ width: '100%' }}>
            {downloads.map((download, index) => (
              <Card key={index} size="small">
                <Space>
                  <span style={{ fontSize: 20, color: '#1890ff' }}>
                    {getFileIcon(download.fileType)}
                  </span>
                  <div>
                    <Text strong>{download.label}</Text>
                    <br />
                    <Tag>{download.fileType?.toUpperCase() || 'FILE'}</Tag>
                  </div>
                  <Button
                    type="link"
                    icon={<DownloadOutlined />}
                    href={download.fileUrl}
                    target="_blank"
                  >
                    Download
                  </Button>
                </Space>
              </Card>
            ))}
          </Space>
        </div>
      )}
    </Space>
  )
}
