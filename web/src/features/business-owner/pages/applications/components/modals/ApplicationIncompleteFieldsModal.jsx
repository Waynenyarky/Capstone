import { Modal, Descriptions, Typography } from 'antd'

const { Text } = Typography

export default function ApplicationIncompleteFieldsModal({ open, onClose, incompleteFields = [] }) {
  if (incompleteFields.length === 0) {
    return (
      <Modal
        title="Incomplete Fields"
        open={open}
        onCancel={onClose}
        footer={null}
        width={600}
      >
        <Text type="secondary">All fields are completed</Text>
      </Modal>
    )
  }

  // Group fields by section
  const groupedBySection = incompleteFields.reduce((acc, item) => {
    const sectionMatch = item.displayName.match(/^Section \d+ - /)
    const sectionName = sectionMatch ? item.displayName.split(' - ')[0] : 'Other'
    const fieldName = sectionMatch ? item.displayName.replace(sectionMatch[0], '') : item.displayName
    if (!acc[sectionName]) {
      acc[sectionName] = []
    }
    acc[sectionName].push(fieldName)
    return acc
  }, {})

  return (
    <Modal
      title={`Incomplete Fields (${incompleteFields.length})`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Descriptions column={1} bordered size="small" labelStyle={{ width: '150px' }}>
        {Object.entries(groupedBySection)
          .sort(([a], [b]) => {
            // Sort "Other" to the end
            if (a === 'Other') return 1
            if (b === 'Other') return -1
            return a.localeCompare(b)
          })
          .map(([sectionName, fields]) => (
          <Descriptions.Item key={sectionName} label={sectionName}>
            {fields.join(', ')}
          </Descriptions.Item>
        ))}
      </Descriptions>
    </Modal>
  )
}
