import { useState, useMemo } from 'react'

export function useCmsAuditPagination(data, pageSize = 20) {
  const [page, setPage] = useState(1)

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return data.slice(start, end)
  }, [data, page, pageSize])

  return {
    page,
    setPage,
    paginatedData,
    total: data.length,
    pageSize,
  }
}
