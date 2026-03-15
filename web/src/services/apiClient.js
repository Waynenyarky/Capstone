import { get, post, put, patch, del } from '@/lib/http.js'

/**
 * Simple API client wrapper for compatibility with existing service imports
 * This provides axios-like interface methods that delegate to the http.js utilities
 */
const apiClient = {
  get: (url, config) => get(url),
  post: (url, data, config) => post(url, data),
  put: (url, data, config) => put(url, data),
  patch: (url, data, config) => patch(url, data),
  delete: (url, config) => del(url),
  
  // For direct access to response data
  getWithData: async (url, config) => {
    const response = await get(url)
    return response
  }
}

export default apiClient
