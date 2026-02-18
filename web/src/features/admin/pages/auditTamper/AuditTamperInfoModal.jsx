import React from 'react'
import { Modal, Button, Typography } from 'antd'

const { Text } = Typography

export default function AuditTamperInfoModal({ open, onClose }) {
  return (
    <Modal
      title="About Audit Tamper"
      open={open}
      onCancel={onClose}
      footer={[<Button key="close" onClick={onClose}>Close</Button>]}
      width={560}
    >
      <p>
        This page helps you monitor and respond to <strong>audit log tampering</strong>. The system verifies that audit log entries have not been altered by comparing stored hashes and, when available, on-chain records. When a mismatch is detected, a tamper incident is created and you are alerted here.
      </p>

      <p><strong>Overview</strong> — Summary of incident counts (total, open, acknowledged, resolved). If there are open incidents, you will see a warning and can jump to the Incidents tab.</p>

      <p>
        <strong>Incidents</strong> — List of all tamper incidents with filters by status and severity. For each incident you can: <strong>Acknowledge</strong> to mark it as seen, <strong>Contain</strong> to freeze sensitive actions for affected accounts, and <strong>Resolve</strong> with resolution notes and optionally lift containment. Expand a row to see affected user IDs and audit log IDs.
      </p>

      <p>
        <strong>Guidance</strong> — Explains what tampering means, how detection works, and what to do when you are alerted (triage, contain, verify, resolve). Use it as a reference when handling incidents.
      </p>
    </Modal>
  )
}
