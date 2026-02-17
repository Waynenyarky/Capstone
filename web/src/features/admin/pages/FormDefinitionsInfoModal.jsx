import React from 'react'
import { Modal, Drawer, Typography, Space, Divider } from 'antd'

const { Text } = Typography

const InfoContent = () => (
  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
    <Text>
      Form definitions define the requirements and downloadable templates for business applications. Each definition can target specific business types and LGUs.
    </Text>

    <Divider style={{ margin: '8px 0' }} />

    <div>
      <Text strong>Form types</Text>
      <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
        <li><Text>Business Registration – initial registration requirements</Text></li>
        <li><Text>Business Permit – permit application requirements</Text></li>
        <li><Text>Business Renewal – renewal requirements</Text></li>
        <li><Text>Cessation – business closure requirements</Text></li>
        <li><Text>Violation – violation response requirements</Text></li>
        <li><Text>Appeal – appeal submission requirements</Text></li>
      </ul>
    </div>

    <div>
      <Text strong>Status workflow</Text>
      <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
        <li><Text>Draft – editable, can be submitted for approval</Text></li>
        <li><Text>Pending Approval – awaiting 2 admin approvals</Text></li>
        <li><Text>Published – live and used by applicants</Text></li>
        <li><Text>Archived – no longer active</Text></li>
      </ul>
    </div>

    <Text type="secondary" style={{ fontSize: 12 }}>
      Use search and filters to find definitions. Duplicate a published form to create a new draft version.
    </Text>
  </Space>
)

export default function FormDefinitionsInfoModal({ open, onClose, isMobile = false }) {
  if (isMobile) {
    return (
      <Drawer
        title="About Form Definitions"
        placement="bottom"
        open={open}
        onClose={onClose}
        height="90vh"
      >
        <InfoContent />
      </Drawer>
    )
  }

  return (
    <Modal
      title="About Form Definitions"
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
    >
      <InfoContent />
    </Modal>
  )
}
