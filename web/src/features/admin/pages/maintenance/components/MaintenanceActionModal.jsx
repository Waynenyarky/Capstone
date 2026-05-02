import React from 'react'
import { Modal, Form, Input } from 'antd'

const { TextArea } = Input

export default function MaintenanceActionModal({ open, onCancel, onOk, approved, submitting, comment, onCommentChange }) {
  return (
    <Modal
      title={approved ? 'Approve Request' : 'Reject Request'}
      open={open}
      onCancel={onCancel}
      onOk={onOk}
      okText={approved ? 'Approve' : 'Reject'}
      okButtonProps={{ loading: submitting, disabled: !approved && !comment.trim() }}
      cancelButtonProps={{ disabled: submitting }}
    >
      <Form layout="vertical">
        <Form.Item
          label={approved ? 'Comment (optional)' : 'Comment (required for rejection)'}
          required={!approved}
        >
          <TextArea
            rows={4}
            placeholder={approved ? 'Add a comment (optional)' : 'Please provide a reason for rejection'}
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
