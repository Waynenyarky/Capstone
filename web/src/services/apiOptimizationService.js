/**
 * API Optimization Service
 * Optimizes API performance through caching, request deduplication, and response optimization
 */

class ApiOptimizationService {
  constructor() {
    this.requestCache = new Map()
    this.pendingRequests = new Map()
    this.requestMetrics = {
      totalRequests: 0,
      cacheHits: 0,
      averageResponseTime: 0,
      slowRequests: []
    }
    this.cacheConfig = {
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      maxCacheSize: 1000,
      cleanupInterval: 60 * 1000 // 1 minute
    }
    
    // Start cleanup interval
    this.startCleanupInterval()
  }

  // Request deduplication
  async deduplicateRequest(key, requestFn) {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)
    }

    // Create new request promise
    const requestPromise = requestFn()
    
    // Store pending request
    this.pendingRequests.set(key, requestPromise)
    
    try {
      const result = await requestPromise
      return result
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(key)
    }
  }

  // Response caching
  async cachedRequest(key, requestFn, options = {}) {
    const {
      ttl = this.cacheConfig.defaultTtl,
      bypassCache = false,
      cacheKey = key
    } = options

    const startTime = performance.now()
    this.requestMetrics.totalRequests++

    // Check cache first (unless bypassed)
    if (!bypassCache) {
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        this.requestMetrics.cacheHits++
        return cached.data
      }
    }

    try {
      // Deduplicate concurrent requests
      const result = await this.deduplicateRequest(key, requestFn)
      
      // Cache the result
      this.setCache(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl
      })

      // Track performance
      const responseTime = performance.now() - startTime
      this.trackRequestPerformance(key, responseTime)

      return result
    } catch (error) {
      // Track failed requests
      const responseTime = performance.now() - startTime
      this.trackRequestPerformance(key, responseTime, error)
      throw error
    }
  }

  // Cache management
  getFromCache(key) {
    const cached = this.requestCache.get(key)
    if (!cached) return null

    // Check if cache entry is expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.requestCache.delete(key)
      return null
    }

    return cached
  }

  setCache(key, value) {
    // Check cache size limit
    if (this.requestCache.size >= this.cacheConfig.maxCacheSize) {
      this.evictOldestCacheEntry()
    }

    this.requestCache.set(key, value)
  }

  evictOldestCacheEntry() {
    let oldestKey = null
    let oldestTimestamp = Infinity

    for (const [key, value] of this.requestCache.entries()) {
      if (value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.requestCache.delete(oldestKey)
    }
  }

  clearCache(pattern = null) {
    if (pattern) {
      // Clear cache entries matching pattern
      for (const key of this.requestCache.keys()) {
        if (key.includes(pattern)) {
          this.requestCache.delete(key)
        }
      }
    } else {
      // Clear all cache
      this.requestCache.clear()
    }
  }

  // Performance tracking
  trackRequestPerformance(key, responseTime, error = null) {
    this.requestMetrics.averageResponseTime = 
      (this.requestMetrics.averageResponseTime * (this.requestMetrics.totalRequests - 1) + responseTime) / 
      this.requestMetrics.totalRequests

    // Track slow requests (> 2 seconds)
    if (responseTime > 2000) {
      this.requestMetrics.slowRequests.push({
        key,
        responseTime,
        timestamp: Date.now(),
        error: error?.message
      })
    }
  }

  getMetrics() {
    return {
      ...this.requestMetrics,
      cacheHitRate: this.requestMetrics.totalRequests > 0 
        ? (this.requestMetrics.cacheHits / this.requestMetrics.totalRequests) * 100 
        : 0,
      cacheSize: this.requestCache.size,
      pendingRequests: this.pendingRequests.size
    }
  }

  resetMetrics() {
    this.requestMetrics = {
      totalRequests: 0,
      cacheHits: 0,
      averageResponseTime: 0,
      slowRequests: []
    }
  }

  // Cleanup expired cache entries
  startCleanupInterval() {
    setInterval(() => {
      const now = Date.now()
      const keysToDelete = []

      for (const [key, value] of this.requestCache.entries()) {
        if (now - value.timestamp > value.ttl) {
          keysToDelete.push(key)
        }
      }

      keysToDelete.forEach(key => this.requestCache.delete(key))
    }, this.cacheConfig.cleanupInterval)
  }

  // Request batching
  async batchRequests(requests) {
    const startTime = performance.now()
    
    try {
      // Execute all requests in parallel
      const results = await Promise.allSettled(
        requests.map(request => 
          typeof request === 'function' ? request() : request
        )
      )

      const responseTime = performance.now() - startTime
      this.trackRequestPerformance('batch_request', responseTime)

      return results
    } catch (error) {
      const responseTime = performance.now() - startTime
      this.trackRequestPerformance('batch_request', responseTime, error)
      throw error
    }
  }

  // Request retry with exponential backoff
  async retryRequest(requestFn, options = {}) {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2
    } = options

    let lastError = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn()
      } catch (error) {
        lastError = error

        if (attempt < maxRetries) {
          const delay = Math.min(
            baseDelay * Math.pow(backoffFactor, attempt),
            maxDelay
          )
          
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }

  // Request compression
  compressPayload(payload) {
    if (typeof payload === 'string') {
      return this.compressString(payload)
    }
    
    if (payload && typeof payload === 'object') {
      const jsonString = JSON.stringify(payload)
      return this.compressString(jsonString)
    }
    
    return payload
  }

  compressString(str) {
    // Simple compression simulation
    // In a real implementation, you'd use a proper compression library
    return btoa(str)
  }

  decompressPayload(compressedPayload) {
    try {
      // Simple decompression simulation
      const decompressed = atob(compressedPayload)
      return JSON.parse(decompressed)
    } catch {
      return compressedPayload
    }
  }

  // Request prioritization
  createPriorityQueue() {
    const queue = []
    let isProcessing = false

    return {
      add: (request, priority = 0) => {
        queue.push({ request, priority, timestamp: Date.now() })
        queue.sort((a, b) => b.priority - a.priority || a.timestamp - b.timestamp)
        
        if (!isProcessing) {
          this.processQueue(queue, () => { isProcessing = false })
        }
      },
      
      size: () => queue.length
    }
  }

  async processQueue(queue, onDone) {
    if (queue.length === 0) {
      onDone()
      return
    }

    const { request } = queue.shift()
    
    try {
      await request()
    } catch (error) {
      console.error('Priority queue request failed:', error)
    }

    // Process next item
    setTimeout(() => this.processQueue(queue, onDone), 0)
  }

  // Rate limiting
  createRateLimiter(maxRequests, windowMs) {
    const requests = []

    return {
      checkLimit: () => {
        const now = Date.now()
        
        // Remove old requests outside the window
        while (requests.length > 0 && requests[0] <= now - windowMs) {
          requests.shift()
        }

        return requests.length < maxRequests
      },
      
      addRequest: () => {
        requests.push(Date.now())
      },
      
      getWaitTime: () => {
        if (requests.length < maxRequests) return 0
        
        const oldestRequest = requests[0]
        return Math.max(0, oldestRequest + windowMs - Date.now())
      }
    }
  }

  // Request transformation
  transformRequest(request, options = {}) {
    const {
      addTimestamp = true,
      addRequestId = true,
      compress = false,
      transformData = null
    } = options

    let transformedRequest = { ...request }

    // Add timestamp
    if (addTimestamp) {
      transformedRequest.timestamp = Date.now()
    }

    // Add request ID
    if (addRequestId) {
      transformedRequest.requestId = this.generateRequestId()
    }

    // Transform data
    if (transformData && transformedRequest.data) {
      transformedRequest.data = transformData(transformedRequest.data)
    }

    // Compress payload
    if (compress && transformedRequest.data) {
      transformedRequest.data = this.compressPayload(transformedRequest.data)
      transformedRequest.compressed = true
    }

    return transformedRequest
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Response optimization
  optimizeResponse(response, options = {}) {
    const {
      compress = false,
      removeNullFields = false,
      includeMetadata = false
    } = options

    let optimizedResponse = { ...response }

    // Remove null fields
    if (removeNullFields) {
      optimizedResponse = this.removeNullFields(optimizedResponse)
    }

    // Add metadata
    if (includeMetadata) {
      optimizedResponse.metadata = {
        timestamp: Date.now(),
        requestId: response.requestId,
        processingTime: response.processingTime
      }
    }

    // Compress response
    if (compress && optimizedResponse.data) {
      optimizedResponse.data = this.compressPayload(optimizedResponse.data)
      optimizedResponse.compressed = true
    }

    return optimizedResponse
  }

  removeNullFields(obj) {
    if (obj === null || obj === undefined) return obj
    
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      const result = {}
      for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined) {
          result[key] = this.removeNullFields(value)
        }
      }
      return result
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeNullFields(item))
    }
    
    return obj
  }

  // Cleanup
  destroy() {
    this.clearCache()
    this.pendingRequests.clear()
    this.resetMetrics()
  }
}

// Singleton instance
export const apiOptimizationService = new ApiOptimizationService()

// Export utilities
export const createOptimizedApiClient = (baseClient, options = {}) => {
  const {
    enableCaching = true,
    enableRetry = true,
    enableCompression = false,
    defaultTtl = 5 * 60 * 1000
  } = options

  return {
    async get(url, config = {}) {
      if (enableCaching) {
        const cacheKey = `GET:${url}:${JSON.stringify(config)}`
        return apiOptimizationService.cachedRequest(
          cacheKey,
          () => baseClient.get(url, config),
          { ttl: defaultTtl }
        )
      }

      return baseClient.get(url, config)
    },

    async post(url, data, config = {}) {
      let optimizedData = data
      if (enableCompression) {
        optimizedData = apiOptimizationService.compressPayload(data)
      }

      const requestFn = () => baseClient.post(url, optimizedData, config)
      
      if (enableRetry) {
        return apiOptimizationService.retryRequest(requestFn, config.retryOptions)
      }
      
      return requestFn()
    },

    async put(url, data, config = {}) {
      let optimizedData = data
      if (enableCompression) {
        optimizedData = apiOptimizationService.compressPayload(data)
      }

      return baseClient.put(url, optimizedData, config)
    },

    async delete(url, config = {}) {
      return baseClient.delete(url, config)
    },

    // Batch requests
    async batch(requests) {
      return apiOptimizationService.batchRequests(requests)
    },

    // Cache management
    clearCache: (pattern) => apiOptimizationService.clearCache(pattern),
    getMetrics: () => apiOptimizationService.getMetrics()
  }
}

export default apiOptimizationService
