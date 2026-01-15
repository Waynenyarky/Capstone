/**
 * Use Case: Delete Passkey
 * Business logic for deleting a passkey
 */
export class DeletePasskeyUseCase {
  constructor({ webauthnRepository, userRepository }) {
    this.webauthnRepository = webauthnRepository
    this.userRepository = userRepository
  }

  async execute({ credId }) {
    if (!credId) {
      throw new Error('Credential ID is required')
    }

    try {
      await this.webauthnRepository.deleteCredential(credId)
      // Refresh user data to reflect changes
      await this.userRepository.refreshUser()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to delete passkey' }
    }
  }
}
