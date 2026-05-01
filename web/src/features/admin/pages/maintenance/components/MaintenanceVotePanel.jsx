import React from 'react'
import { Typography, Tag, Space, Button, Divider } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, UndoOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { userName, userEmail, entityId } from '../utils/maintenance.utils.js'

const { Text } = Typography

export default function MaintenanceVotePanel({ approval, admins, myVote, canVote, canUndoVote, onApproveClick, onDenyClick, onUndoClick, undoDeadline, token }) {
  const requesterId = entityId(approval?.requestedBy)
  const requesterEmail = userEmail(approval?.requestedBy)?.toLowerCase()
  const currentUser = { _id: 'current_user_id', email: 'current@example.com' } // This should come from auth context

  return (
    <div style={{ marginBottom: 16 }}>
      <Text style={{ display: 'block', marginBottom: 8 }}>Admin votes :</Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {admins
          .filter((admin) => {
            const adminId = entityId(admin)
            const adminEmail = userEmail(admin).toLowerCase()
            if (adminId && (adminId === requesterId || adminId === currentUser._id)) return false
            if (adminEmail && (adminEmail === requesterEmail || adminEmail === currentUser.email)) return false
            return true
          })
          .map((admin) => {
            const vote = approval?.approvals?.find(
              (a) => entityId(a.adminId) === entityId(admin)
            )
            if (vote) {
              return (
                <div
                  key={entityId(admin)}
                  style={{
                    padding: 8,
                    background: token.colorFillQuaternary,
                    borderRadius: token.borderRadius,
                    fontSize: 12,
                  }}
                >
                  <Space size={2}>
                    <Tag color={vote.approved ? 'success' : 'error'}>
                      {vote.approved ? 'Approved' : 'Rejected'}
                    </Tag>
                    <Text>{userName(admin)}</Text>
                  </Space>
                  <Divider style={{ margin: '8px 0' }} />
                  {vote.comment ? (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                        Reason: {vote.comment}
                      </Text>
                    </div>
                  ) : (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4, fontStyle: 'italic' }}>
                        No comment provided
                      </Text>
                    </div>
                  )}
                  {vote.timestamp && (
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                      Submitted on: {new Date(vote.timestamp).toLocaleString()}
                    </Text>
                  )}
                </div>
              )
            } else {
              return (
                <div
                  key={entityId(admin)}
                  style={{
                    padding: 8,
                    background: token.colorFillQuaternary,
                    borderRadius: token.borderRadius,
                    fontSize: 12,
                  }}
                >
                  <Space size={2}>
                    <Tag color="gold">Pending</Tag>
                    <Text>{userName(admin)}</Text>
                  </Space>
                </div>
              )
            }
          })}
      </div>

      {myVote && (
        <div
          style={{
            marginTop: 16,
            padding: 8,
            background: token.colorFillQuaternary,
            borderRadius: token.borderRadius,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <Space size={2}>
              <Tag color={myVote.approved ? 'success' : 'error'}>
                {myVote.approved ? 'Approved' : 'Rejected'}
              </Tag>
              <Text>{userName(currentUser)}</Text>
            </Space>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          {myVote?.comment ? (
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                Reason: {myVote.comment}
              </Text>
            </div>
          ) : (
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4, fontStyle: 'italic' }}>
                No comment provided
              </Text>
            </div>
          )}
          {myVote?.timestamp && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              Submitted on: {new Date(myVote.timestamp).toLocaleString()}
            </Text>
          )}
          <Divider style={{ margin: '8px 0' }} />
          <Button icon={<UndoOutlined />} onClick={onUndoClick}>
            Undo
          </Button>
          {undoDeadline && (
            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
              {canUndoVote
                ? `Undo available until ${dayjs(undoDeadline).format('MMM D, YYYY HH:mm')}`
                : 'Undo no longer available'
              }
            </Text>
          )}
        </div>
      )}

      {canVote && (
        <div
          style={{
            marginTop: 16,
            padding: 8,
            background: token.colorFillQuaternary,
            borderRadius: token.borderRadius,
            fontSize: 12,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <Space size={2}>
              <Tag color="gold">Pending</Tag>
              <Text>{userName(currentUser)}</Text>
            </Space>
          </div>
          <Divider style={{ margin: '8px 0' }} />
          <Space>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={onApproveClick}>
              Approve Request
            </Button>
            <Button danger icon={<CloseCircleOutlined />} onClick={onDenyClick}>
              Reject Request
            </Button>
          </Space>
        </div>
      )}
    </div>
  )
}
