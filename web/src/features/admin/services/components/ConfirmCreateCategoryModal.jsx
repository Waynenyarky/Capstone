import React from 'react'
import { Modal, Descriptions, Tag } from 'antd'

export default function ConfirmCreateCategoryModal({ open, values, onOk, onCancel }) {
  const v = values || {}
  return (
    <Modal
      open={open}
      title="Confirm Create Category"
      okText="Create"
      cancelText="Cancel"
      onOk={onOk}
      onCancel={onCancel}
      maskClosable={false}
    >
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Name">{v.name || '-'}</Descriptions.Item>
        <Descriptions.Item label="Status">{v.status ? <Tag>{v.status}</Tag> : '-'}</Descriptions.Item>
        <Descriptions.Item label="Icon">{v.icon || '-'}</Descriptions.Item>
        <Descriptions.Item label="Description">{v.description || '-'}</Descriptions.Item>
      </Descriptions>
    </Modal>
  )
}