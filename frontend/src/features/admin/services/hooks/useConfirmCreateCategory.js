import React from 'react'
import { ConfirmCreateCategoryModal } from "@/features/admin/services"

export function useConfirmCreateCategory() {
  const [open, setOpen] = React.useState(false)
  const [values, setValues] = React.useState(null)
  const resolverRef = React.useRef(null)

  const confirm = (vals) => {
    setValues(vals || {})
    setOpen(true)
    return new Promise((resolve) => {
      resolverRef.current = resolve
    })
  }

  const handleOk = () => {
    setOpen(false)
    if (resolverRef.current) resolverRef.current(true)
    resolverRef.current = null
  }

  const handleCancel = () => {
    setOpen(false)
    if (resolverRef.current) resolverRef.current(false)
    resolverRef.current = null
  }

  const ModalPortal = () => (
    React.createElement(ConfirmCreateCategoryModal, {
      open,
      values,
      onOk: handleOk,
      onCancel: handleCancel,
    })
  )

  return { confirm, ConfirmModal: ModalPortal }
}