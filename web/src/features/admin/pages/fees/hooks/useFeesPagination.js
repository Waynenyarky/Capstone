import { useState, useEffect } from 'react'

export function useFeesPagination(data, pageSize = 10) {
  const [page, setPage] = useState(1)

  // Reset to page 1 when data changes
  useEffect(() => {
    setPage(1)
  }, [data])

  const paginatedData = data.slice((page - 1) * pageSize, page * pageSize)
  const total = data.length

  return {
    page,
    setPage,
    paginatedData,
    total,
    pageSize,
  }
}
