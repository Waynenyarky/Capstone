/**
 * Database Optimization Service
 * Optimizes database performance through query optimization, indexing, and caching strategies
 */

const { MongoClient } = require('mongodb')
const Redis = require('redis')

class DatabaseOptimizationService {
  constructor() {
    this.redisClient = null
    this.mongoClient = null
    this.queryCache = new Map()
    this.performanceMetrics = {
      queryCount: 0,
      averageQueryTime: 0,
      slowQueries: [],
      cacheHitRate: 0
    }
  }

  async initialize() {
    try {
      // Initialize Redis for caching
      this.redisClient = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      })
      await this.redisClient.connect()

      // Initialize MongoDB client
      this.mongoClient = new MongoClient(process.env.MONGODB_URL || 'mongodb://localhost:27017')
      await this.mongoClient.connect()

      console.log('Database optimization service initialized')
    } catch (error) {
      console.error('Failed to initialize database optimization service:', error)
    }
  }

  // Query optimization
  async optimizeQuery(collection, query, options = {}) {
    const startTime = performance.now()
    const cacheKey = this.generateCacheKey(collection, query, options)

    try {
      // Check cache first
      if (options.cache !== false) {
        const cached = await this.getCachedQuery(cacheKey)
        if (cached) {
          this.performanceMetrics.cacheHitRate = 
            (this.performanceMetrics.cacheHitRate * this.performanceMetrics.queryCount + 1) / 
            (this.performanceMetrics.queryCount + 1)
          return cached
        }
      }

      // Execute optimized query
      const db = this.mongoClient.db()
      const result = await this.executeOptimizedQuery(db.collection(collection), query, options)

      // Cache result if enabled
      if (options.cache !== false && options.cacheTime > 0) {
        await this.cacheQuery(cacheKey, result, options.cacheTime)
      }

      // Track performance
      const queryTime = performance.now() - startTime
      this.trackQueryPerformance(queryTime, collection, query)

      return result
    } catch (error) {
      console.error('Query optimization failed:', error)
      throw error
    }
  }

  async executeOptimizedQuery(collection, query, options) {
    let mongoQuery = { ...query }
    let mongoOptions = { ...options }

    // Remove cache-specific options
    delete mongoOptions.cache
    delete mongoOptions.cacheTime

    // Apply query optimizations
    mongoQuery = this.applyQueryOptimizations(mongoQuery)
    mongoOptions = this.applyOptionOptimizations(mongoOptions)

    // Use aggregation for complex queries
    if (this.shouldUseAggregation(query, options)) {
      return this.executeAggregationQuery(collection, mongoQuery, mongoOptions)
    }

    // Use cursor for large result sets
    if (options.useCursor || (options.limit && options.limit > 1000)) {
      return this.executeCursorQuery(collection, mongoQuery, mongoOptions)
    }

    return collection.find(mongoQuery, mongoOptions).toArray()
  }

  applyQueryOptimizations(query) {
    const optimized = { ...query }

    // Convert regex patterns to case-insensitive for better index usage
    Object.keys(optimized).forEach(key => {
      if (optimized[key] instanceof RegExp) {
        const flags = optimized[key].flags.includes('i') ? optimized[key].flags : optimized[key].flags + 'i'
        optimized[key] = new RegExp(optimized[key].source, flags)
      }
    })

    // Add $exists: false checks for optional fields to improve index usage
    // This helps MongoDB use indexes more effectively

    return optimized
  }

  applyOptionOptimizations(options) {
    const optimized = { ...options }

    // Set reasonable default limits to prevent excessive data retrieval
    if (!optimized.limit && !optimized.useCursor) {
      optimized.limit = 1000
    }

    // Add projection to limit returned fields
    if (!optimized.projection && optimized.limit) {
      optimized.projection = { _id: 1, createdAt: 1, updatedAt: 1 }
    }

    // Enable appropriate read preferences
    if (!optimized.readPreference) {
      optimized.readPreference = 'secondaryPreferred'
    }

    return optimized
  }

  shouldUseAggregation(query, options) {
    // Use aggregation for complex queries with multiple operations
    const hasComplexOperations = options.sort && Object.keys(options.sort).length > 1
    const hasGrouping = options.group || options.aggregate
    const hasLookup = options.lookup || options.populate

    return hasComplexOperations || hasGrouping || hasLookup
  }

  async executeAggregationQuery(collection, query, options) {
    const pipeline = []

    // Match stage
    if (Object.keys(query).length > 0) {
      pipeline.push({ $match: query })
    }

    // Lookup stages for population
    if (options.lookup) {
      options.lookup.forEach(lookup => {
        pipeline.push({
          $lookup: lookup
        })
      })
    }

    // Sort stage
    if (options.sort) {
      pipeline.push({ $sort: options.sort })
    }

    // Limit stage
    if (options.limit) {
      pipeline.push({ $limit: options.limit })
    }

    // Skip stage
    if (options.skip) {
      pipeline.push({ $skip: options.skip })
    }

    // Project stage
    if (options.projection) {
      pipeline.push({ $project: options.projection })
    }

    return collection.aggregate(pipeline).toArray()
  }

  async executeCursorQuery(collection, query, options) {
    const cursor = collection.find(query, options)
    
    if (options.batchSize) {
      cursor.batchSize(options.batchSize)
    }

    const results = []
    await cursor.forEach(doc => results.push(doc))
    return results
  }

  // Index management
  async ensureIndexes(collection, indexes) {
    try {
      const db = this.mongoClient.db()
      const coll = db.collection(collection)

      for (const index of indexes) {
        await coll.createIndex(index.keys, index.options)
      }

      console.log(`Indexes ensured for collection: ${collection}`)
    } catch (error) {
      console.error('Failed to ensure indexes:', error)
    }
  }

  async analyzeIndexes(collection) {
    try {
      const db = this.mongoClient.db()
      const coll = db.collection(collection)

      const indexes = await coll.indexes()
      const stats = await coll.stats()

      return {
        indexes,
        documentCount: stats.count,
        avgDocumentSize: stats.avgObjSize,
        totalIndexSize: stats.totalIndexSize
      }
    } catch (error) {
      console.error('Failed to analyze indexes:', error)
      return null
    }
  }

  async suggestIndexes(collection, sampleQueries = []) {
    try {
      const analysis = await this.analyzeIndexes(collection)
      const suggestions = []

      // Analyze sample queries to suggest indexes
      for (const query of sampleQueries) {
        const suggestedIndex = this.analyzeQueryForIndexing(query)
        if (suggestedIndex) {
          suggestions.push(suggestedIndex)
        }
      }

      // Check for missing common indexes
      const commonIndexes = [
        { keys: { createdAt: -1 }, options: { name: 'created_at_desc' } },
        { keys: { updatedAt: -1 }, options: { name: 'updated_at_desc' } },
        { keys: { status: 1 }, options: { name: 'status_asc' } }
      ]

      for (const index of commonIndexes) {
        const exists = analysis.indexes.some(existing => 
          existing.name === index.options.name
        )
        if (!exists) {
          suggestions.push(index)
        }
      }

      return suggestions
    } catch (error) {
      console.error('Failed to suggest indexes:', error)
      return []
    }
  }

  analyzeQueryForIndexing(query) {
    const fields = Object.keys(query)
    
    // Skip queries that are too simple or too complex
    if (fields.length === 0 || fields.length > 3) {
      return null
    }

    // Create compound index for multi-field queries
    if (fields.length > 1) {
      const indexKeys = {}
      fields.forEach(field => {
        indexKeys[field] = 1
      })
      
      return {
        keys: indexKeys,
        options: { 
          name: `compound_${fields.join('_')}`,
          background: true
        }
      }
    }

    // Single field index
    const field = fields[0]
    return {
      keys: { [field]: 1 },
      options: { 
        name: `${field}_asc`,
        background: true
      }
    }
  }

  // Caching utilities
  generateCacheKey(collection, query, options) {
    const key = {
      collection,
      query,
      options: { ...options, cache: undefined, cacheTime: undefined }
    }
    return `db_cache_${Buffer.from(JSON.stringify(key)).toString('base64')}`
  }

  async getCachedQuery(key) {
    try {
      const cached = await this.redisClient.get(key)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Failed to get cached query:', error)
      return null
    }
  }

  async cacheQuery(key, data, ttl = 300) {
    try {
      await this.redisClient.setEx(key, ttl, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to cache query:', error)
    }
  }

  async clearCache(pattern = 'db_cache_*') {
    try {
      const keys = await this.redisClient.keys(pattern)
      if (keys.length > 0) {
        await this.redisClient.del(keys)
      }
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  // Performance monitoring
  trackQueryPerformance(queryTime, collection, query) {
    this.performanceMetrics.queryCount++
    this.performanceMetrics.averageQueryTime = 
      (this.performanceMetrics.averageQueryTime * (this.performanceMetrics.queryCount - 1) + queryTime) / 
      this.performanceMetrics.queryCount

    // Track slow queries (> 100ms)
    if (queryTime > 100) {
      this.performanceMetrics.slowQueries.push({
        collection,
        query,
        time: queryTime,
        timestamp: new Date()
      })
    }
  }

  getPerformanceMetrics() {
    return { ...this.performanceMetrics }
  }

  resetPerformanceMetrics() {
    this.performanceMetrics = {
      queryCount: 0,
      averageQueryTime: 0,
      slowQueries: [],
      cacheHitRate: 0
    }
  }

  // Connection pooling
  async getConnectionPoolStats() {
    try {
      const db = this.mongoClient.db()
      const admin = db.admin()
      const serverStatus = await admin.serverStatus()
      
      return {
        connections: serverStatus.connections,
        network: serverStatus.network,
        opcounters: serverStatus.opcounters
      }
    } catch (error) {
      console.error('Failed to get connection pool stats:', error)
      return null
    }
  }

  // Data archiving
  async archiveOldData(collection, cutoffDate, archiveCollection) {
    try {
      const db = this.mongoClient.db()
      const source = db.collection(collection)
      const archive = db.collection(archiveCollection)

      // Find documents to archive
      const docsToArchive = await source.find({
        createdAt: { $lt: cutoffDate }
      }).toArray()

      if (docsToArchive.length > 0) {
        // Insert into archive collection
        await archive.insertMany(docsToArchive)
        
        // Remove from source collection
        await source.deleteMany({
          createdAt: { $lt: cutoffDate }
        })

        console.log(`Archived ${docsToArchive.length} documents from ${collection}`)
      }

      return docsToArchive.length
    } catch (error) {
      console.error('Failed to archive old data:', error)
      throw error
    }
  }

  // Cleanup
  async cleanup() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit()
      }
      if (this.mongoClient) {
        await this.mongoClient.close()
      }
      console.log('Database optimization service cleaned up')
    } catch (error) {
      console.error('Failed to cleanup database optimization service:', error)
    }
  }
}

module.exports = new DatabaseOptimizationService()
