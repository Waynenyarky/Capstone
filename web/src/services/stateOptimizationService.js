/**
 * State Optimization Service
 * Optimizes state management patterns to reduce re-renders and improve performance
 */

// State normalization utilities
export const normalizeState = (state, _schema) => {
  const normalized = {
    entities: {},
    ids: []
  }

  if (!Array.isArray(state)) {
    return normalized
  }

  state.forEach(item => {
    const id = item.id || item._id || item.businessId
    if (id) {
      normalized.entities[id] = item
      normalized.ids.push(id)
    }
  })

  return normalized
}

// Memoized selectors
export const createMemoizedSelector = (selector, dependencies = []) => {
  let lastResult = null
  let lastDependencies = null

  return (state) => {
    const currentDependencies = dependencies.map(dep => dep(state))
    
    if (!lastDependencies || currentDependencies.some((dep, index) => dep !== lastDependencies[index])) {
      lastResult = selector(state)
      lastDependencies = currentDependencies
    }
    
    return lastResult
  }
}

// Debounced state updates
export const createDebouncedStateUpdate = (updateFn, delay = 300) => {
  let timeoutId = null
  
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => updateFn(...args), delay)
  }
}

// State persistence utilities
export const createStatePersistence = (key, storage = localStorage) => {
  return {
    save: (state) => {
      try {
        storage.setItem(key, JSON.stringify(state))
      } catch (error) {
        console.warn('Failed to persist state:', error)
      }
    },
    
    load: () => {
      try {
        const stored = storage.getItem(key)
        return stored ? JSON.parse(stored) : null
      } catch (error) {
        console.warn('Failed to load persisted state:', error)
        return null
      }
    },
    
    clear: () => {
      try {
        storage.removeItem(key)
      } catch (error) {
        console.warn('Failed to clear persisted state:', error)
      }
    }
  }
}

// State caching utilities
export const createStateCache = (maxSize = 100) => {
  const cache = new Map()
  
  return {
    get: (key) => cache.get(key),
    set: (key, value) => {
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value
        cache.delete(firstKey)
      }
      cache.set(key, value)
    },
    clear: () => cache.clear(),
    size: () => cache.size
  }
}

// Optimized state updates
export const createOptimizedStateUpdater = (setState) => {
  return (updater) => {
    if (typeof updater === 'function') {
      setState(prevState => {
        const newState = updater(prevState)
        // Only update if state actually changed
        if (newState === prevState) {
          return prevState
        }
        return newState
      })
    } else {
      setState(updater)
    }
  }
}

// Batch state updates
export const batchStateUpdates = (updates) => {
  return new Promise(resolve => {
    // Use requestAnimationFrame to batch updates
    requestAnimationFrame(() => {
      Promise.all(updates.map(update => Promise.resolve(update()))).then(resolve)
    })
  })
}

// State change detection
export const createStateChangeDetector = (onChange) => {
  let previousState = null
  
  return (currentState) => {
    if (previousState !== currentState) {
      onChange(currentState, previousState)
      previousState = currentState
    }
  }
}

// Performance monitoring for state
export const createStatePerformanceMonitor = () => {
  const metrics = {
    updateCount: 0,
    lastUpdateTime: null,
    averageUpdateTime: 0
  }
  
  return {
    trackUpdate: (updateFn) => {
      return (...args) => {
        const startTime = performance.now()
        const result = updateFn(...args)
        const endTime = performance.now()
        
        metrics.updateCount++
        metrics.lastUpdateTime = endTime
        metrics.averageUpdateTime = (metrics.averageUpdateTime * (metrics.updateCount - 1) + (endTime - startTime)) / metrics.updateCount
        
        return result
      }
    },
    
    getMetrics: () => ({ ...metrics }),
    
    reset: () => {
      metrics.updateCount = 0
      metrics.lastUpdateTime = null
      metrics.averageUpdateTime = 0
    }
  }
}

// Optimized data fetching with state management
export const createOptimizedDataFetcher = (fetchFn, options = {}) => {
  const {
    cacheKey,
    cache = createStateCache(),
    staleTime = 5 * 60 * 1000, // 5 minutes
    retryCount = 3,
    retryDelay = 1000
  } = options
  
  return async (params) => {
    const key = cacheKey ? `${cacheKey}-${JSON.stringify(params)}` : JSON.stringify(params)
    
    // Check cache first
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < staleTime) {
      return cached.data
    }
    
    let lastError = null
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const data = await fetchFn(params)
        
        // Cache the result
        cache.set(key, {
          data,
          timestamp: Date.now()
        })
        
        return data
      } catch (error) {
        lastError = error
        
        if (attempt < retryCount) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
        }
      }
    }
    
    throw lastError
  }
}

// State validation utilities
export const createStateValidator = (schema) => {
  return (state) => {
    const errors = []
    
    const validate = (data, path = '') => {
      if (typeof schema === 'object' && schema !== null) {
        for (const key in schema) {
          const fieldPath = path ? `${path}.${key}` : key
          const fieldSchema = schema[key]
          const fieldValue = data?.[key]
          
          if (fieldSchema.required && (fieldValue === undefined || fieldValue === null)) {
            errors.push(`${fieldPath} is required`)
          }
          
          if (fieldSchema.type && fieldValue !== undefined && fieldValue !== null) {
            const expectedType = fieldSchema.type
            const actualType = typeof fieldValue
            
            if (expectedType === 'array' && !Array.isArray(fieldValue)) {
              errors.push(`${fieldPath} must be an array`)
            } else if (expectedType !== 'array' && actualType !== expectedType) {
              errors.push(`${fieldPath} must be of type ${expectedType}`)
            }
          }
          
          if (fieldSchema.properties && typeof fieldValue === 'object') {
            validate(fieldValue, fieldPath)
          }
        }
      }
    }
    
    validate(state)
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// State optimization hooks
export const useOptimizedState = (initialState, _options = {}) => {
  // Implementation would depend on React hooks
  // This is a placeholder for the hook implementation
  return {
    state: initialState,
    setState: () => {},
    reset: () => {}
  }
}

export default {
  normalizeState,
  createMemoizedSelector,
  createDebouncedStateUpdate,
  createStatePersistence,
  createStateCache,
  createOptimizedStateUpdater,
  batchStateUpdates,
  createStateChangeDetector,
  createStatePerformanceMonitor,
  createOptimizedDataFetcher,
  createStateValidator,
  useOptimizedState
}
