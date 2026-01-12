import { useState, useEffect, useCallback } from 'react'
import { getPendingBills, getPaymentHistory, processPayment } from '../services/paymentService'

export function usePayments() {
  const [activeTab, setActiveTab] = useState('1')
  const [bills, setBills] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBill, setSelectedBill] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [b, h] = await Promise.all([getPendingBills(), getPaymentHistory()])
      setBills(b)
      setHistory(h)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handlePay = async (id, method, txId) => {
    try {
        await processPayment(id, method, txId)
        fetchData()
        setSelectedBill(null)
        return true
    } catch (err) {
        console.error(err)
        throw err
    }
  }

  return {
    activeTab,
    setActiveTab,
    bills,
    history,
    loading,
    selectedBill,
    setSelectedBill,
    handlePay,
    refresh: fetchData
  }
}
