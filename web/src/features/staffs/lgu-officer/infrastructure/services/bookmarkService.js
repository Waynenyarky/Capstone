import { get, post, del } from '@/lib/http.js'

export default class BookmarkService {
  async getBookmarks() {
    const response = await get('/api/bookmarks')
    return response.data
  }

  async addBookmark(itemType, itemId) {
    const response = await post('/api/bookmarks', { itemType, itemId })
    return response.data
  }

  async removeBookmark(bookmarkId) {
    const response = await del(`/api/bookmarks/${bookmarkId}`)
    return response.data
  }

  async checkBookmark(itemType, itemId) {
    const response = await get(`/api/bookmarks/check?itemType=${itemType}&itemId=${itemId}`)
    return response.data
  }
}
