import { useState } from 'react'

export function useHelpRequestAuditFilters() {
  const [searchValue, setSearchValue] = useState('')

  return {
    searchValue,
    setSearchValue,
  }
}
