/**
 * Application Layer: WebAuthn Repository Interface
 * Defines the contract for WebAuthn operations
 * Implementation is in infrastructure layer
 */
export class WebAuthnRepository {
  constructor(webauthnService) {
    this.service = webauthnService
  }

  async getRegistrationOptions({ email }) {
    return await this.service.registerStart(email ? { email } : {})
  }

  async completeRegistration({ email, credential }) {
    return await this.service.registerComplete({ email, credential })
  }

  async getAuthenticationOptions({ email }) {
    return await this.service.authenticateStart(email ? { email } : {})
  }

  async completeAuthentication({ email, credential }) {
    return await this.service.authenticateComplete({ email, credential })
  }

  async getCrossDeviceOptions({ sessionId, type }) {
    return await this.service.crossDeviceAuthOptions({ sessionId, type })
  }

  async completeCrossDevice({ sessionId, credential }) {
    return await this.service.crossDeviceComplete({ sessionId, credential })
  }

  async listCredentials() {
    return await this.service.listCredentials()
  }

  async deleteCredential(credId) {
    return await this.service.deleteCredential(credId)
  }

  async deleteAllCredentials() {
    return await this.service.deleteAllCredentials()
  }
}
