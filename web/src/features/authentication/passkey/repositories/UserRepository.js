/**
 * Application Layer: User Repository Interface
 * Defines the contract for user operations
 */
export class UserRepository {
  constructor(authService, authSession) {
    // authService can be an object with methods or the service itself
    this.getProfile = authService?.getProfile || authService
    this.currentUser = authSession?.currentUser
    this.login = authSession?.login
  }

  async refreshUser() {
    try {
      const updated = await this.getProfile()
      
      // Preserve token if it exists
      if (this.currentUser?.token && updated && !updated.token) {
        updated.token = this.currentUser.token
      }
      
      const isRemembered = !!localStorage.getItem('auth__currentUser')
      if (this.login) {
        this.login(updated, { remember: isRemembered })
      }
      
      return updated
    } catch (error) {
      console.error('Failed to refresh user data:', error)
      throw error
    }
  }
}
