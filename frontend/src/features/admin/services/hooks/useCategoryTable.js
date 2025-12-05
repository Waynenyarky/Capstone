import { useEffect, useState } from 'react'
import { fetchWithFallback } from "@/lib/http.js"
import { useNotifier } from '@/shared/notifications.js'

export function useCategoryTable() {
  const { error } = useNotifier()
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const reloadCategories = async () => {
    setIsLoading(true)
    const res = await fetchWithFallback('/api/categories')
    if (!res || !res.ok) {
      error('Failed to load categories')
      setIsLoading(false)
      return
    }
    const data = await res.json()
    setCategories(Array.isArray(data) ? data : [])
    setIsLoading(false)
  }

  useEffect(() => {
    reloadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { categories, isLoading, reloadCategories, setCategories }
}