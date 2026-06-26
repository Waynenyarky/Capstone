import { useState, useCallback } from 'react'

export function useDocumentPreview() {
  const [previewModal, setPreviewModal] = useState({ open: false, url: null, label: '', type: 'other' })

  const handlePreview = useCallback((file) => {
    const url = file.originFileObj ? URL.createObjectURL(file.originFileObj) : file.url || file.thumbUrl || null
    const lookup = `${url || ''} ${file.name || ''}`.toLowerCase()
    let fileType = 'other'
    if (lookup.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg|heic|heif)/i)) fileType = 'image'
    else if (lookup.match(/\.(pdf)/i)) fileType = 'pdf'
    setPreviewModal({ open: true, url, label: file.name, type: fileType })
  }, [])

  const closePreview = useCallback(() => {
    setPreviewModal({ open: false, url: null, label: '', type: 'other' })
  }, [])

  const openPreviewWithUrl = useCallback((url, label, type = 'other') => {
    setPreviewModal({ open: true, url, label, type })
  }, [])

  return {
    previewModal,
    handlePreview,
    closePreview,
    openPreviewWithUrl,
  }
}
