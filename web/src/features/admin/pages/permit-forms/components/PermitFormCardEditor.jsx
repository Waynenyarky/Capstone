import { Card, Input, InputNumber, Button, Space, Typography, Tooltip, Modal } from 'antd'
import {
  DeleteOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  HolderOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import FileUploadButton from './FileUploadButton'
import { DESCRIPTION_PLACEHOLDER } from '../constants'
import { createEmptyStep } from '../utils'

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

  const handleStepChange = (index, field, value) => {
    const newSteps = [...(card.processingSteps || [])]
    newSteps[index] = { ...newSteps[index], [field]: value }
    onUpdate(card.cardId, { processingSteps: newSteps })
  }

  const handleAddStep = () => {
    const steps = card.processingSteps || []
    const newStep = createEmptyStep(steps.length)
    onUpdate(card.cardId, { processingSteps: [...steps, newStep] })
  }

  const handleRemoveStep = (index) => {
    const newSteps = (card.processingSteps || [])
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, order: i }))
    onUpdate(card.cardId, { processingSteps: newSteps })
  }

  const handleMoveStep = (fromIndex, toIndex) => {
    const steps = [...(card.processingSteps || [])]
    const [moved] = steps.splice(fromIndex, 1)
    steps.splice(toIndex, 0, moved)
    onUpdate(card.cardId, { processingSteps: steps.map((s, i) => ({ ...s, order: i })) })
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
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
            Processing Steps
          </Text>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {(card.processingSteps || []).map((step, index) => (
              <div
                key={step.stepId}
                style={{
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: 6,
                  padding: '8px 12px',
                  background: token.colorBgLayout,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Text type="secondary" style={{ fontSize: 12, minWidth: 20, textAlign: 'right', flexShrink: 0 }}>
                    {index + 1}.
                  </Text>
                  <Input
                    value={step.title}
                    onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                    placeholder={`Step ${index + 1} title`}
                    style={{ flex: 1 }}
                    size="small"
                  />
                  <InputNumber
                    value={step.estimatedDurationDays}
                    onChange={(val) => handleStepChange(index, 'estimatedDurationDays', val ?? 0)}
                    min={0}
                    max={365}
                    size="small"
                    style={{ width: 80, flexShrink: 0 }}
                    addonAfter="d"
                  />
                  <Tooltip title="Move up">
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowUpOutlined />}
                      disabled={index === 0}
                      onClick={() => handleMoveStep(index, index - 1)}
                      style={{ padding: 0, width: 24, height: 24 }}
                    />
                  </Tooltip>
                  <Tooltip title="Move down">
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowDownOutlined />}
                      disabled={index === (card.processingSteps || []).length - 1}
                      onClick={() => handleMoveStep(index, index + 1)}
                      style={{ padding: 0, width: 24, height: 24 }}
                    />
                  </Tooltip>
                  <Tooltip title="Remove step">
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => handleRemoveStep(index)}
                      size="small"
                      style={{ flexShrink: 0 }}
                    />
                  </Tooltip>
                </div>
                <div style={{ marginLeft: 28 }}>
                  <Input.TextArea
                    value={step.description}
                    onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                    placeholder="Describe what happens in this step"
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    size="small"
                    maxLength={500}
                  />
                </div>
              </div>
            ))}
            {(!card.processingSteps || card.processingSteps.length === 0) && (
              <Text type="secondary" italic>
                No processing steps added yet. Click &quot;Add Step&quot; to define the workflow.
              </Text>
            )}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddStep}
              block
            >
              Add Step
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
