import React from 'react'
import { Modal } from 'antd'

export function useConfirmCreateCategory() {
  const confirm = (vals) => {
    return new Promise((resolve) => {
      Modal.confirm({
        title: 'Create category',
        content: React.createElement(
          'div',
          null,
          React.createElement('div', null, React.createElement('strong', null, 'Name:'), ` ${vals?.name || ''}`),
          React.createElement('div', null, React.createElement('strong', null, 'Description:'), ` ${vals?.description || ''}`)
        ),
        onOk() { resolve(true) },
        onCancel() { resolve(false) },
      })
    })
  }

  return { confirm }
}