import React from 'react'
import { Modal, Drawer, Typography, Space, Divider } from 'antd'

const { Text } = Typography

const InfoContent = () => (
  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
    <Text>
      The BPLO uses a <Text strong>unified business permit form</Text> for all business types, as required by law. This page manages that form and all related BPLO forms. When a form changes, admins create a new version, edit it, and publish it after approval.
    </Text>

    <Divider style={{ margin: '8px 0' }} />

    <div>
      <Text strong>What you can do here</Text>
      <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
        <li><Text><strong>Overview</strong> — See all form types and their current published version (or draft).</Text></li>
        <li><Text><strong>Select a form type</strong> — Use the left panel to open Unified Business Permit, General Permit, Renewal, Cessation, Violation, or Appeal. Then view or edit that form&apos;s requirements and content.</Text></li>
        <li><Text><strong>Add version</strong> — Create a new draft (from scratch or by duplicating a published form). Edit sections, requirement items, and attachments.</Text></li>
        <li><Text><strong>Submit for approval</strong> — From draft, submit for approval; two admin approvals are required before publish.</Text></li>
        <li><Text><strong>Publish / Deactivate</strong> — After approval, publish to make the form live. You can deactivate a published form when it is superseded.</Text></li>
        <li><Text><strong>History</strong> — View the audit trail of changes (who created or updated which version and when).</Text></li>
      </ul>
    </div>

    <div>
      <Text strong>Forms managed</Text>
      <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
        <li><Text>Unified Business Permit – main permit application; includes business activity (tax code, line of business) used for fee computation.</Text></li>
        <li><Text>General Permit – cooperatives, associations, firecracker stall holders, bazaar/festival vendors, peddlers, etc. (CBPLO-GPI-F06).</Text></li>
        <li><Text>Business Renewal – annual renewal requirements (every January).</Text></li>
        <li><Text>Cessation – business closure / retirement.</Text></li>
        <li><Text>Violation – violation documentation.</Text></li>
        <li><Text>Appeal – appeal submission requirements.</Text></li>
      </ul>
    </div>

    <div>
      <Text strong>Status workflow</Text>
      <ul style={{ margin: '4px 0 0 0', paddingLeft: 20 }}>
        <li><Text>Draft – editable; can be submitted for approval.</Text></li>
        <li><Text>Pending Approval – awaiting 2 admin approvals.</Text></li>
        <li><Text>Published – live and used by applicants.</Text></li>
        <li><Text>Archived – no longer active.</Text></li>
      </ul>
    </div>
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
