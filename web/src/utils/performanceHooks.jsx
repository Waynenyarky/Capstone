import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { debounce, throttle } from 'lodash-es'

/**
 * Performance optimization hooks for React components
 */

// Debounced state update hook
export const useDebouncedState = (initialValue, delay = 300) => {
  const [state, setState] = useState(initialValue)
  const debouncedSetState = useMemo(
    () => debounce(setState, delay),
    [delay]
  )

  useEffect(() => {
    return () => {
      debouncedSetState.cancel()
    }
  }, [debouncedSetState])

  return [state, debouncedSetState]
}

// Throttled state update hook
export const useThrottledState = (initialValue, delay = 300) => {
  const [state, setState] = useState(initialValue)
  const throttledSetState = useMemo(
    () => throttle(setState, delay),
    [delay]
  )

  useEffect(() => {
    return () => {
      throttledSetState.cancel()
    }
  }, [throttledSetState])

  return [state, throttledSetState]
}

// Memoized async data hook
export const useAsyncData = (asyncFn, dependencies = [], options = {}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const {
    immediate = true,
    debounceMs = 0,
    retryCount = 0,
    retryDelay = 1000
  } = options

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await asyncFn()
      setData(result)
    } catch (err) {
      setError(err)
      
      // Retry logic
      if (retryCount > 0) {
        setTimeout(() => execute(), retryDelay)
      }
    } finally {
      setLoading(false)
    }
  }, [asyncFn, retryCount, retryDelay])

  const debouncedExecute = useMemo(
    () => debounceMs > 0 ? debounce(execute, debounceMs) : execute,
    [execute, debounceMs]
  )

  useEffect(() => {
    if (immediate) {
      debouncedExecute()
    }
    
    return () => {
      debouncedExecute.cancel()
    }
  }, dependencies)

  return { data, loading, error, refetch: debouncedExecute }
}

// Virtual scrolling hook
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    )
    
    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      offsetY: startIndex * itemHeight
    }
  }, [items, itemHeight, containerHeight, scrollTop])

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop)
  }, [])

  return {
    visibleItems,
    handleScroll,
    totalHeight: items.length * itemHeight
  }
}

// Infinite scroll hook
export const useInfiniteScroll = (loadMore, hasMore = true) => {
  const [loading, setLoading] = useState(false)
  const observerRef = useRef()

  const lastElementRef = useCallback(node => {
    if (loading) return
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setLoading(true)
        loadMore().finally(() => setLoading(false))
      }
    })
    
    if (node) observerRef.current.observe(node)
  }, [loading, hasMore, loadMore])

  return { lastElementRef, loading }
}

// Pagination hook
export const usePagination = (initialPage = 1, initialPageSize = 10) => {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const nextPage = useCallback(() => {
    setPage(prev => prev + 1)
  }, [])

  const prevPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1))
  }, [])

  const goToPage = useCallback((targetPage) => {
    setPage(Math.max(1, targetPage))
  }, [])

  const resetPage = useCallback(() => {
    setPage(initialPage)
  }, [initialPage])

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    goToPage,
    resetPage
  }
}

// Local storage hook
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue]
}

// Session storage hook
export const useSessionStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.sessionStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue]
}

// Media query hook
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}

// Idle detection hook
export const useIdleDetection = (timeout = 5000) => {
  const [isIdle, setIsIdle] = useState(false)
  
  useEffect(() => {
    let timeoutId
    
    const handleActivity = () => {
      setIsIdle(false)
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => setIsIdle(true), timeout)
    }
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity)
    })
    
    // Initial timeout
    timeoutId = setTimeout(() => setIsIdle(true), timeout)
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      clearTimeout(timeoutId)
    }
  }, [timeout])

  return isIdle
}

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const metricsRef = useRef({
    renderCount: 0,
    renderTime: 0,
    lastRenderTime: 0
  })

  useEffect(() => {
    metricsRef.current.renderCount++
    const now = performance.now()
    
    if (metricsRef.current.lastRenderTime > 0) {
      metricsRef.current.renderTime = now - metricsRef.current.lastRenderTime
    }
    
    metricsRef.current.lastRenderTime = now
  })

  return {
    getMetrics: () => ({ ...metricsRef.current }),
    resetMetrics: () => {
      metricsRef.current = {
        renderCount: 0,
        renderTime: 0,
        lastRenderTime: 0
      }
    }
  }
}

// Resource loading hook
export const useResourceLoader = (resourceFn, dependencies = []) => {
  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const loadResource = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await resourceFn()
        if (!cancelled) {
          setResource(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadResource()

    return () => {
      cancelled = true
    }
  }, dependencies)

  return { resource, loading, error }
}

// Optimized image loading hook
export const useImageLoader = (src, options = {}) => {
  const [imageState, setImageState] = useState({
    loading: true,
    loaded: false,
    error: null
  })

  useEffect(() => {
    const img = new Image()
    
    img.onload = () => {
      setImageState({
        loading: false,
        loaded: true,
        error: null
      })
    }
    
    img.onerror = () => {
      setImageState({
        loading: false,
        loaded: false,
        error: 'Failed to load image'
      })
    }
    
    img.src = src
    
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src])

  return imageState
}

// Debounced search hook
export const useDebouncedSearch = (initialSearchTerm = '', delay = 300) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearchTerm)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm, delay])

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm
  }
}

// Memoized array operations hook
export const useArrayOperations = (initialArray = []) => {
  const [array, setArray] = useState(initialArray)

  const operations = useMemo(() => ({
    addItem: (item) => setArray(prev => [...prev, item]),
    removeItem: (index) => setArray(prev => prev.filter((_, i) => i !== index)),
    updateItem: (index, item) => setArray(prev => prev.map((item, i) => i === index ? item : item)),
    clearArray: () => setArray([]),
    filterArray: (predicate) => setArray(prev => prev.filter(predicate)),
    sortArray: (compareFn) => setArray(prev => [...prev].sort(compareFn))
  }), [])

  return [array, operations]
}

// Form state hook with validation
export const useFormState = (initialState = {}, schema = null) => {
  const [values, setValues] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Clear error when value changes
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }, [errors])

  const setError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [])

  const setFieldTouched = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
  }, [])

  const validateField = useCallback((name, value) => {
    if (!schema) return true
    
    const fieldSchema = schema[name]
    if (!fieldSchema) return true
    
    try {
      fieldSchema.parse(value)
      setError(name, null)
      return true
    } catch (validationError) {
      setError(name, validationError.message)
      return false
    }
  }, [schema, setError])

  const validateForm = useCallback(() => {
    if (!schema) return true
    
    let isValid = true
    
    for (const [name, fieldSchema] of Object.entries(schema)) {
      if (!validateField(name, values[name])) {
        isValid = false
      }
    }
    
    return isValid
  }, [schema, values, validateField])

  const resetForm = useCallback(() => {
    setValues(initialState)
    setErrors({})
    setTouched({})
  }, [initialState])

  return {
    values,
    errors,
    touched,
    setValue,
    setError,
    setFieldTouched,
    validateField,
    validateForm,
    resetForm,
    isValid: Object.keys(errors).length === 0
  }
}

export default {
  useDebouncedState,
  useThrottledState,
  useAsyncData,
  useVirtualScroll,
  useInfiniteScroll,
  usePagination,
  useLocalStorage,
  useSessionStorage,
  useMediaQuery,
  useIdleDetection,
  usePerformanceMonitor,
  useResourceLoader,
  useImageLoader,
  useDebouncedSearch,
  useArrayOperations,
  useFormState
}
