import React from 'react'
import { ConfirmEditCategoryModal } from "@/features/admin/services"

export function useConfirmEditCategory() {
  const [open, setOpen] = React.useState(false)
  const [values, setValues] = React.useState(null)
  const [selected, setSelected] = React.useState(null)
  const resolverRef = React.useRef(null)

  const confirm = (vals, sel) => {
    setValues(vals || {})
    setSelected(sel || null)
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
    React.createElement(ConfirmEditCategoryModal, {
      open,
      values,
      selected,
      onOk: handleOk,
      onCancel: handleCancel,
    })
  )

  return { confirm, ConfirmModal: ModalPortal }
}