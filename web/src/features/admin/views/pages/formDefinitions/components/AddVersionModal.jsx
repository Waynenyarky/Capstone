import React from 'react'
import { Modal, Radio, Typography, Space } from 'antd'
import { CopyOutlined, GlobalOutlined, FileAddOutlined } from '@ant-design/icons'

const { Text } = Typography

const SOURCE_PREVIOUS = 'previous'
const SOURCE_GLOBAL = 'global'
const SOURCE_SCRATCH = 'scratch'

/**
 * Modal for choosing how to create a new industry-specific form version:
 * - Use previous version as template
 * - Use global form for this form type
 * - Create from scratch (with hint)
 */
export default function AddVersionModal({
  open,
  onClose,
  industryLabel,
  formTypeLabel,
  hasPreviousVersion = false,
  hasGlobalForm = true,
  onConfirm,
}) {
  const [source, setSource] = React.useState(
    hasPreviousVersion ? SOURCE_PREVIOUS : hasGlobalForm ? SOURCE_GLOBAL : SOURCE_SCRATCH
  )

  React.useEffect(() => {
    if (open) {
      setSource(hasPreviousVersion ? SOURCE_PREVIOUS : hasGlobalForm ? SOURCE_GLOBAL : SOURCE_SCRATCH)
    }
  }, [open, hasPreviousVersion, hasGlobalForm])

  const handleOk = () => {
    if (source === SOURCE_PREVIOUS && !hasPreviousVersion) return
    onConfirm?.(source)
    onClose?.()
  }

  const canConfirm = source !== SOURCE_PREVIOUS || hasPreviousVersion

  const options = []
  if (hasPreviousVersion) {
    options.push({
      value: SOURCE_PREVIOUS,
      label: 'Use previous version as template',
      description: 'Copy the latest version and edit.',
      icon: CopyOutlined,
    })
  }
  if (hasGlobalForm) {
    options.push({
      value: SOURCE_GLOBAL,
      label: 'Use global form for this form type',
      description: 'Start from the default form that applies to all industries.',
      icon: GlobalOutlined,
    })
  }
  options.push({
    value: SOURCE_SCRATCH,
    label: 'Create from scratch',
    description: 'Use this only if the industry is very different from the global form.',
    icon: FileAddOutlined,
  })

  return (
    <Modal
      title="Add version"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Continue"
      okButtonProps={{ disabled: !canConfirm }}
      width={480}
      destroyOnHidden
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        How would you like to create the new {formTypeLabel.toLowerCase()} form for {industryLabel}?
      </Text>
      <Radio.Group
        value={source}
        onChange={(e) => setSource(e.target.value)}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {options.map((opt) => {
            const Icon = opt.icon
            return (
              <Radio key={opt.value} value={opt.value} style={{ width: '100%', marginRight: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <Text strong>{opt.label}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{opt.description}</Text>
                  </div>
                </div>
              </Radio>
            )
          })}
        </Space>
      </Radio.Group>
    </Modal>
  )
}

export { SOURCE_PREVIOUS, SOURCE_GLOBAL, SOURCE_SCRATCH }
