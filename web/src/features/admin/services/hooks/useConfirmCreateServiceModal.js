import React from 'react'

export function useConfirmCreateServiceModal({ onConfirm } = {}) {
  const [open, setOpen] = React.useState(false)
  const [values, setValues] = React.useState(null)
  const [confirmLoading, setConfirmLoading] = React.useState(false)

  const show = (nextValues) => {
    setValues(nextValues)
    setOpen(true)
  }

  const hide = () => {
    setOpen(false)
    setValues(null)
  }

  const handleConfirm = async () => {
    if (typeof onConfirm !== 'function') {
      hide()
      return
    }
    setConfirmLoading(true)
    try {
      await onConfirm(values)
    } finally {
      setConfirmLoading(false)
      hide()
    }
  }

  return { open, values, show, hide, handleConfirm, confirmLoading }
}