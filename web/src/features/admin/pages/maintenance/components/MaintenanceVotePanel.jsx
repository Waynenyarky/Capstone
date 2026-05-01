import React from 'react'
import { Typography, Tag, Space, Button, Divider } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, UndoOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { userName } from '../utils/maintenance.utils.js'

const { Text } = Typography

export default function MaintenanceVotePanel({ approval, admins, myVote, canVote, canUndoVote, onApproveClick, onDenyClick, onUndoClick, undoDeadline, token }) {
  const approvedVotes = (approval?.approvals || []).filter((a) => a.approved === true)
  const rejectedVotes = (approval?.approvals || []).filter((a) => a.approved === false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Text strong style={{ fontSize: 13 }}>Admin Votes</Text>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {admins.map((admin) => {
            const vote = approval?.approvals?.find((a) => String(a.adminId) === String(admin._id))
            const isCurrentUser = vote?.adminId?._id === vote?.adminId
            return (
              <div key={admin._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={8}>
                  <Text style={{ fontSize: 13 }}>{userName(admin)}</Text>
                  {vote && (
                    <Tag color={vote.approved ? 'green' : 'red'} style={{ margin: 0 }}>
                      {vote.approved ? 'Approved' : 'Rejected'}
                    </Tag>
                  )}
                </Space>
                {vote?.comment && (
                  <Text type="secondary" style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {vote.comment}
                  </Text>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <div>
        <Text strong style={{ fontSize: 13 }}>Your Action</Text>
        {myVote ? (
          <div style={{ marginTop: 8 }}>
            <Tag color={myVote.approved ? 'green' : 'red'}>
              You {myVote.approved ? 'approved' : 'rejected'}
            </Tag>
            {canUndoVote && undoDeadline && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Undo available until {dayjs(undoDeadline).format('MMM D, YYYY HH:mm')}
                </Text>
                <Button
                  size="small"
                  icon={<UndoOutlined />}
                  onClick={onUndoClick}
                  style={{ marginTop: 4 }}
                >
                  Undo Vote
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={onApproveClick}
              disabled={!canVote}
            >
              Approve
            </Button>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={onDenyClick}
              disabled={!canVote}
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
