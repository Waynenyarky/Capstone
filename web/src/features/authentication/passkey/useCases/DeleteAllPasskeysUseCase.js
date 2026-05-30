/**
 * Use Case: Delete All Passkeys
 * Business logic for deleting all user's passkeys
 */
export class DeleteAllPasskeysUseCase {
  constructor({ webauthnRepository, userRepository }) {
    this.webauthnRepository = webauthnRepository
    this.userRepository = userRepository
  }

  async execute() {
    try {
      await this.webauthnRepository.deleteAllCredentials()
      // Refresh user data to reflect changes
      await this.userRepository.refreshUser()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to disable passkeys' }
    }
  }
}
