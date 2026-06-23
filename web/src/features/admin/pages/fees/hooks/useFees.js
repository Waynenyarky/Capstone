import { useState, useMemo, useEffect } from 'react'
import { getFeeGroups, getFees, getPenaltyRules } from '@/features/admin/services/feeService'
import { getAddButtonLabel } from '../utils/fees.utils'

export function useFees() {
  const [selectedType, setSelectedType] = useState('fee_groups')
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [feeGroups, setFeeGroups] = useState([])
  const [fees, setFees] = useState([])
  const [penaltyRules, setPenaltyRules] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [groups, feeList, penalties] = await Promise.all([
        getFeeGroups({ isActive: true }),
        getFees({ isActive: true }),
        getPenaltyRules({ isActive: true }),
      ])
      setFeeGroups(groups)
      setFees(feeList)
      setPenaltyRules(penalties)
    } catch (error) {
      console.error('Failed to load fees data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const items = useMemo(() => {
    switch (selectedType) {
      case 'fee_groups':
        return feeGroups.map((group) => ({
          ...group,
          amount: group.fees?.reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0,
        }))
      case 'fees':
        return fees
      case 'penalty_rules':
        return penaltyRules
      default:
        return []
    }
  }, [selectedType, feeGroups, fees, penaltyRules])

  const selectedItem = items.find((i) => i._id === selectedItemId)

  const addButtonLabel = useMemo(() => {
    return getAddButtonLabel(selectedType)
  }, [selectedType])

  const handleTypeChange = (value) => {
    setSelectedType(value)
    setSelectedItemId(null)
  }

  const handleSelectItem = (item) => {
    setSelectedItemId(item._id)
  }

  const handleAddNew = () => {
    setSelectedItemId('new')
  }

  const handleDelete = async (id) => {
    try {
      if (selectedType === 'fee_groups') {
        // Import disableFeeGroup to avoid circular dependency
        const { disableFeeGroup } = await import('@/features/admin/services/feeService')
        await disableFeeGroup(id)
      } else if (selectedType === 'fees') {
        const { disableFee } = await import('@/features/admin/services/feeService')
        await disableFee(id)
      } else if (selectedType === 'penalty_rules') {
        const { disablePenaltyRule } = await import('@/features/admin/services/feeService')
        await disablePenaltyRule(id)
      }
      await loadData()
      if (selectedItemId === id) {
        setSelectedItemId(null)
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
      throw error
    }
  }

  return {
    selectedType,
    setSelectedType: handleTypeChange,
    selectedItemId,
    setSelectedItemId,
    items,
    selectedItem,
    addButtonLabel,
    onSelectItem: handleSelectItem,
    onAddNew: handleAddNew,
    onDelete: handleDelete,
    loading,
    refresh: loadData,
    feeGroups,
    fees,
    penaltyRules,
  }
}
