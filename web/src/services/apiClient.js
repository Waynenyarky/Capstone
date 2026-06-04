import { get, post, put, patch, del } from '@/lib/http.js'

/**
 * Simple API client wrapper for compatibility with existing service imports
 * This provides axios-like interface methods that delegate to the http.js utilities
 */
const apiClient = {
  get: (url) => get(url),
  post: (url, data) => post(url, data),
  put: (url, data) => put(url, data),
  patch: (url, data) => patch(url, data),
  delete: (url) => del(url),
  
  // For direct access to response data
  getWithData: async (url) => {
    const response = await get(url)
    return response
  }
}

export default apiClient
