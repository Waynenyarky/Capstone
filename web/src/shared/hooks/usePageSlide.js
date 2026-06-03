import { createContext, useContext } from 'react'

export const PageSlideContext = createContext(null)

export function usePageSlide() {
  return useContext(PageSlideContext)
}
