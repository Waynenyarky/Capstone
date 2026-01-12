import { useState, useEffect, useCallback } from 'react'
import { getPermits, createPermit } from '../services/permitService'

export function usePermitApplications() {
  const [permits, setPermits] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const fetchPermits = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPermits()
      setPermits(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPermits()
  }, [fetchPermits])

  const handleCreate = async (values) => {
    try {
        await createPermit(values)
        setIsModalVisible(false)
        fetchPermits()
    } catch (err) {
        console.error('Failed to create permit:', err)
        throw err
    }
  }
  
  const openModal = () => setIsModalVisible(true)
  const closeModal = () => setIsModalVisible(false)

  return {
    permits,
    loading,
    isModalVisible,
    openModal,
    closeModal,
    handleCreate,
    refresh: fetchPermits
  }
}
