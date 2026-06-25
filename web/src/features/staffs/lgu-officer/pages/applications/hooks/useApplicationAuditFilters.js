import { useState } from 'react'

export function useApplicationAuditFilters() {
  const [searchValue, setSearchValue] = useState('')

  return {
    searchValue,
    setSearchValue,
  }
}
