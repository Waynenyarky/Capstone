import { useState, useEffect, useCallback } from 'react'
import { getAppeals, createAppeal } from '../services/appealService'

export function useAppeals() {
  const [appeals, setAppeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const fetchAppeals = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAppeals()
      setAppeals(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAppeals()
  }, [fetchAppeals])

  const handleCreate = async (values) => {
    try {
        await createAppeal(values)
        setIsModalVisible(false)
        fetchAppeals()
        return true
    } catch (err) {
        console.error(err)
        return false
    }
  }

  const openModal = () => setIsModalVisible(true)
  const closeModal = () => setIsModalVisible(false)

  return {
    appeals,
    loading,
    isModalVisible,
    openModal,
    closeModal,
    handleCreate,
    refresh: fetchAppeals
  }
}
