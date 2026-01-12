import { useState, useEffect, useCallback } from 'react'
import { getCessationRequests, createCessationRequest } from '../services/cessationService'

export function useCessation() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCessationRequests()
      setRequests(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleCreate = async (values) => {
    try {
        await createCessationRequest(values)
        setIsModalVisible(false)
        fetchRequests()
        return true
    } catch (err) {
        console.error(err)
        return false
    }
  }

  const openModal = () => setIsModalVisible(true)
  const closeModal = () => setIsModalVisible(false)

  return {
    requests,
    loading,
    isModalVisible,
    openModal,
    closeModal,
    handleCreate,
    refresh: fetchRequests
  }
}
