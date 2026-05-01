import React from 'react'
import { Typography, Tag, Descriptions, Space, theme, Empty } from 'antd'
import { ToolOutlined } from '@ant-design/icons'
import { userName, userEmail, entityId } from '../utils/maintenance.utils.js'
import { STATUS_COLORS } from '../constants/maintenance.constants.js'
import { useMaintenanceApprovalActions } from './hooks/useMaintenanceApprovalActions.js'
import MaintenanceVotePanel from './components/MaintenanceVotePanel.jsx'
import MaintenanceActionModal from './components/MaintenanceActionModal.jsx'

const { Text } = Typography

export default function MaintenanceRequestDetailPanel({ approval, allApprovals, onApprove, onUndoVote, onCancelApproved, onRefresh }) {
  const { token } = theme.useToken()
  
  const {
    localApproval,
    admins,
    actionModalOpen,
    setActionModalOpen,
    actionApproved,
    comment,
    setComment,
    submitting,
    isPending,
    hasVoted,
    myVote,
    canVote,
    isApprovedUpcoming,
    canUndoVote,
    handleApproveClick,
    handleDenyClick,
    handleActionSubmit,
    handleCancelApproved,
    handleUndoVote,
    getUndoDeadline,
  } = useMaintenanceApprovalActions(approval, allApprovals, onApprove, onUndoVote, onCancelApproved, onRefresh)

  const undoDeadline = getUndoDeadline()

  if (!approval) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24 }}>
        <Empty
          image={<ToolOutlined style={{ fontSize: 48, color: token.colorTextTertiary }} />}
          styles={{ image: { height: 60 } }}
          description="Select a maintenance request to view details"
        />
      </div>
    )
  }

  const details = localApproval?.requestDetails || {}
  const requester = localApproval?.requestedBy

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text strong style={{ fontSize: 16 }}>Request Details</Text>
          <Tag color={STATUS_COLORS[localApproval?.status] || 'default'} style={{ textTransform: 'capitalize' }}>
            {localApproval?.status}
          </Tag>
        </Space>
      </div>

      <Descriptions column={1} size="small" bordered style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Request ID">{localApproval?.approvalId || '—'}</Descriptions.Item>
        <Descriptions.Item label="Action">
          {details.action === 'enable' ? 'Enable' : 'Disable'} Maintenance Mode
        </Descriptions.Item>
        <Descriptions.Item label="Reason">{details.reason || '—'}</Descriptions.Item>
        <Descriptions.Item label="Message">{details.message || '—'}</Descriptions.Item>
        <Descriptions.Item label="Requested By">{userName(requester)}</Descriptions.Item>
        <Descriptions.Item label="Requester Email">{userEmail(requester)}</Descriptions.Item>
        <Descriptions.Item label="Created At">
          {localApproval?.createdAt ? new Date(localApproval.createdAt).toLocaleString() : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Scheduled Start">
          {details.scheduledStartAt ? new Date(details.scheduledStartAt).toLocaleString() : 'Immediately after approval'}
        </Descriptions.Item>
        <Descriptions.Item label="Expected Resume">
          {details.expectedResumeAt ? new Date(details.expectedResumeAt).toLocaleString() : '—'}
        </Descriptions.Item>
      </Descriptions>

      <MaintenanceVotePanel
        approval={localApproval}
        admins={admins}
        myVote={myVote}
        canVote={canVote}
        canUndoVote={canUndoVote}
        onApproveClick={handleApproveClick}
        onDenyClick={handleDenyClick}
        onUndoClick={handleUndoVote}
        undoDeadline={undoDeadline}
        token={token}
      />

      {isApprovedUpcoming && (
        <div style={{ marginTop: 16 }}>
          <Button
            danger
            onClick={handleCancelApproved}
            disabled={submitting}
            style={{ width: '100%' }}
          >
            Cancel Approved Maintenance
          </Button>
        </div>
      )}

      <MaintenanceActionModal
        open={actionModalOpen}
        onCancel={() => setActionModalOpen(false)}
        onOk={handleActionSubmit}
        approved={actionApproved}
        submitting={submitting}
        comment={comment}
        onCommentChange={setComment}
      />
    </div>
  )
}
