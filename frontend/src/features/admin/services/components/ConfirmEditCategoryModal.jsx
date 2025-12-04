import React from 'react'
import { Modal, Descriptions, Tag } from 'antd'

export default function ConfirmEditCategoryModal({ open, values, selected, onOk, onCancel }) {
  const v = values || {}
  const prev = selected || {}
  return (
    <Modal
      open={open}
      title="Confirm Save Changes"
      okText="Save"
      cancelText="Cancel"
      onOk={onOk}
      onCancel={onCancel}
      maskClosable={false}
    >
      <Descriptions column={1} bordered size="small" title={prev?.name ? `Editing: ${prev.name}` : undefined}>
        <Descriptions.Item label="Name">{v.name || '-'}</Descriptions.Item>
        <Descriptions.Item label="Status">{v.status ? <Tag>{v.status}</Tag> : '-'}</Descriptions.Item>
        <Descriptions.Item label="Icon">{v.icon || '-'}</Descriptions.Item>
        <Descriptions.Item label="Description">{v.description || '-'}</Descriptions.Item>
      </Descriptions>
    </Modal>
  )
}