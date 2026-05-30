import { Modal, Drawer, Typography, Space, Divider, Collapse, Button } from 'antd'

const { Text } = Typography

const FAQ_ITEMS = [
  {
    key: '1',
    label: 'Why do I need two approvals to publish?',
    children: 'Two admin approvals are required before a form version can be published. This reduces the risk of mistakes going live and keeps an audit trail of who approved the change.',
  },
  {
    key: '2',
    label: 'Can I edit a published form?',
    children: 'No. Published forms are locked. To change content, create a new version (draft from scratch or duplicate the published form), edit the draft, submit for approval, then publish. The new version becomes the active one; you can deactivate the old one.',
  },
  {
    key: '3',
    label: 'What is the difference between deactivate and archive?',
    children: 'Publishing a newer version often supersedes the previous one; you can then deactivate the old published form. Archived means the form version is no longer active and is kept for history only.',
  },
  {
    key: '4',
    label: 'Which form is used for fee calculation?',
    children: 'The Unified Business Permit includes business activity (tax code, line of business) that the system uses for fee computation. Fee Configuration uses these LOBs to set Mayor\'s Permit fees, tax brackets, and related amounts.',
  },
  {
    key: '5',
    label: 'Where do I see who changed what?',
    children: 'Use the History tab (or logs) for the form or form group. It shows who created or updated which version and when, for full auditability.',
  },
]

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
        <li><Text><strong>Select a form type</strong> — Use the left panel to open Unified Business Permit, General Permit, Mayor&apos;s Permit for Occupation, Renewal, Cessation, Violation, or Appeal. Then view or edit that form&apos;s requirements and content.</Text></li>
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
        <li><Text>Mayor&apos;s Permit for Occupation – occupational permit application (e.g. food handlers, non-food handlers) (CBPLO-OPR-F013).</Text></li>
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

    <div>
      <Text strong>Frequently asked questions</Text>
      <Collapse
        size="small"
        items={FAQ_ITEMS}
        style={{ marginTop: 8 }}
        bordered={false}
      />
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
      footer={[<Button key="close" onClick={onClose}>Close</Button>]}
      width={560}
    >
      <InfoContent />
    </Modal>
  )
}
