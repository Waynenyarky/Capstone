/**
 * Use Case: List Passkeys
 * Business logic for listing user's passkeys
 */
export class ListPasskeysUseCase {
  constructor({ webauthnRepository }) {
    this.webauthnRepository = webauthnRepository
  }

  async execute({ email }) {
    if (!email) {
      return { credentials: [] }
    }

    try {
      const response = await this.webauthnRepository.listCredentials()
      return {
        credentials: (response.credentials || []).map(cred => ({
          credId: cred.credId,
          name: cred.name || `Passkey ${cred.credId?.substring(0, 8)}...`,
          createdAt: cred.createdAt,
          lastUsedAt: cred.lastUsedAt,
          transports: cred.transports || []
        }))
      }
    } catch (error) {
      console.error('Failed to list credentials:', error)
      return { credentials: [] }
    }
  }
}
