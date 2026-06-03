import { useState, useCallback } from 'react'
import { CONTENT_TYPES } from '../constants/contentManagement.constants'

export default function useContentManagement() {
  const [contentType, setContentType] = useState('public-announcements')
  const [selectedItem, setSelectedItem] = useState(null)

  const handleContentTypeChange = useCallback((value) => {
    setContentType(value)
    setSelectedItem(null)
  }, [])

  const handleSelectItem = useCallback((item) => {
    setSelectedItem(item)
  }, [])

  const currentContentType = CONTENT_TYPES.find((t) => t.key === contentType)

  return {
    contentType,
    setContentType: handleContentTypeChange,
    selectedItem,
    setSelectedItem: handleSelectItem,
    currentContentType,
  }
}
