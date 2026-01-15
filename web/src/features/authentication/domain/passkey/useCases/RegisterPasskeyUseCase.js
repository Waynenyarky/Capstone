/**
 * Use Case: Register Passkey
 * Business logic for passkey registration
 * This is part of the domain/application layer
 */
export class RegisterPasskeyUseCase {
  constructor({ webauthnRepository, userRepository, notifier }) {
    this.webauthnRepository = webauthnRepository
    this.userRepository = userRepository
    this.notifier = notifier
  }

  async execute({ email }) {
    if (!email) {
      throw new Error('Email is required to register a passkey')
    }

    try {
      // Get registration options from repository
      const options = await this.webauthnRepository.getRegistrationOptions({ email })
      
      // Convert base64url to ArrayBuffer for WebAuthn API
      const publicKey = this._preparePublicKey(options.publicKey)
      
      // Create credential using WebAuthn API
      const credential = await navigator.credentials.create({ publicKey })
      
      // Convert credential to format expected by backend
      const credentialPayload = this._formatCredentialForRegistration(credential)
      
      // Complete registration via repository
      const result = await this.webauthnRepository.completeRegistration({
        email,
        credential: credentialPayload
      })

      return { success: true, result }
    } catch (error) {
      return this._handleError(error)
    }
  }

  _preparePublicKey(pub) {
    const publicKey = { ...pub }
    publicKey.challenge = this._base64ToBuffer(pub.challenge)
    if (pub.user?.id) {
      publicKey.user = { ...pub.user, id: this._base64ToBuffer(pub.user.id) }
    }
    return publicKey
  }

  _formatCredentialForRegistration(credential) {
    const resp = credential.response
    return {
      id: credential.id,
      rawId: this._bufferToBase64(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: this._bufferToBase64(resp.clientDataJSON),
        attestationObject: this._bufferToBase64(resp.attestationObject),
      }
    }
  }

  _handleError(error) {
    if (error.name === 'NotAllowedError') {
      return { success: false, cancelled: true, message: 'Registration was cancelled' }
    }
    if (error.name === 'InvalidStateError') {
      return { success: false, error: 'Passkey already exists on this device' }
    }
    return { success: false, error: error.message || 'Registration failed' }
  }

  _base64ToBuffer(b64) {
    const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes.buffer
  }

  _bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
}
