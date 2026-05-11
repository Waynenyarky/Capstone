import React from 'react'
import { Card, Input, Button, Space, Typography, Tooltip, Modal } from 'antd'
import {
  DeleteOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  HolderOutlined,
} from '@ant-design/icons'
import FileUploadButton from './FileUploadButton'
import { DESCRIPTION_PLACEHOLDER } from '../constants'

const { Text } = Typography
const { TextArea } = Input

export default function PermitFormCardEditor({
  card,
  onUpdate,
  onDelete,
  dragHandleProps,
  token,
}) {
  const handleTitleChange = (e) => {
    onUpdate(card.cardId, { title: e.target.value })
  }

  const handleDescriptionChange = (e) => {
    onUpdate(card.cardId, { description: e.target.value })
  }

  const handleRequirementChange = (index, value) => {
    const newReqs = [...(card.requirements || [])]
    newReqs[index] = value
    onUpdate(card.cardId, { requirements: newReqs })
  }

  const handleAddRequirement = () => {
    const newReqs = [...(card.requirements || []), '']
    onUpdate(card.cardId, { requirements: newReqs })
  }

  const handleRemoveRequirement = (index) => {
    const newReqs = (card.requirements || []).filter((_, i) => i !== index)
    onUpdate(card.cardId, { requirements: newReqs })
  }

  const handleFileChange = (fileData) => {
    onUpdate(card.cardId, { downloadableFile: fileData })
  }

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete this permit form card?',
      content: `Are you sure you want to delete "${card.title || 'Untitled Card'}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => onDelete(card.cardId),
    })
  }

  return (
    <Card
      size="small"
      style={{
        borderColor: token.colorBorderSecondary,
        background: token.colorBgContainer,
      }}
      title={
        <Space>
          <span {...(dragHandleProps || {})} style={{ cursor: 'grab' }}>
            <HolderOutlined style={{ color: token.colorTextQuaternary }} />
          </span>
          <Text strong style={{ fontSize: 14 }}>
            {card.title || 'Untitled Card'}
          </Text>
        </Space>
      }
      extra={
        <Tooltip title="Delete this card">
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            size="small"
          />
        </Tooltip>
      }
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
            Title
          </Text>
          <Input
            value={card.title}
            onChange={handleTitleChange}
            placeholder="e.g., Business Permit, Occupational Permit"
            maxLength={200}
          />
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
            Description
          </Text>
          <TextArea
            value={card.description}
            onChange={handleDescriptionChange}
            placeholder={DESCRIPTION_PLACEHOLDER}
            autoSize={{ minRows: 2, maxRows: 6 }}
            maxLength={2000}
          />
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
            Requirements
          </Text>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            {(card.requirements || []).map((req, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                <Text type="secondary" style={{ lineHeight: '32px', minWidth: 20, textAlign: 'right', flexShrink: 0 }}>
                  {index + 1}.
                </Text>
                <Input
                  value={req}
                  onChange={(e) => handleRequirementChange(index, e.target.value)}
                  placeholder={`Requirement ${index + 1}`}
                  style={{ flex: 1, minWidth: 0 }}
                />
                <Tooltip title="Remove this requirement">
                  <Button
                    type="text"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => handleRemoveRequirement(index)}
                    size="small"
                    style={{ flexShrink: 0 }}
                  />
                </Tooltip>
              </div>
            ))}
            {(!card.requirements || card.requirements.length === 0) && (
              <Text type="secondary" italic>
                No requirements added yet. Click &quot;Add Requirement&quot; to add one.
              </Text>
            )}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddRequirement}
              block
            >
              Add Requirement
            </Button>
          </Space>
        </div>

        <div>
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>
            Downloadable Form (PDF)
          </Text>
          <FileUploadButton
            value={card.downloadableFile}
            onChange={handleFileChange}
            token={token}
          />
        </div>
      </Space>
    </Card>
  )
}
