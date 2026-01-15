/**
 * Use Case: Cross-Device Authentication
 * Business logic for cross-device passkey authentication
 */
export class CrossDeviceAuthUseCase {
  constructor({ webauthnRepository }) {
    this.webauthnRepository = webauthnRepository
  }

  async execute({ sessionId }) {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }

    try {
      // Try authentication first, fallback to registration
      let pub, email, type
      
      try {
        const authResult = await this.webauthnRepository.getCrossDeviceOptions({ 
          sessionId, 
          type: 'authenticate' 
        })
        pub = authResult.publicKey
        email = authResult.email
        type = authResult.type || 'authenticate'
      } catch {
        // If authentication fails, try registration
        const regResult = await this.webauthnRepository.getCrossDeviceOptions({ 
          sessionId, 
          type: 'register' 
        })
        pub = regResult.publicKey
        email = regResult.email
        type = regResult.type || 'register'
      }

      if (!pub || !pub.challenge) {
        throw new Error('Invalid authentication options received from server')
      }

      // Prepare credential based on type
      const credential = await this._createCredential(pub, type)
      
      // Format credential payload
      const credentialPayload = this._formatCredential(credential, type)

      // Complete cross-device authentication
      const result = await this.webauthnRepository.completeCrossDevice({
        sessionId,
        credential: credentialPayload
      })

      return { success: true, result, type, email }
    } catch (error) {
      return this._handleError(error)
    }
  }

  async _createCredential(pub, type) {
    const publicKey = this._preparePublicKey(pub, type)
    
    if (type === 'register') {
      return await navigator.credentials.create({ publicKey })
    } else {
      return await navigator.credentials.get({ publicKey })
    }
  }

  _preparePublicKey(pub, type) {
    const publicKey = { ...pub }
    publicKey.challenge = this._base64ToBuffer(pub.challenge)
    
    if (type === 'register' && pub.user?.id) {
      publicKey.user = { ...pub.user, id: this._base64ToBuffer(pub.user.id) }
    }
    
    if (type === 'authenticate' && pub.allowCredentials) {
      publicKey.allowCredentials = pub.allowCredentials.map(c => ({
        ...c,
        id: this._base64ToBuffer(c.id)
      }))
    }
    
    return publicKey
  }

  _formatCredential(credential, type) {
    const resp = credential.response
    
    if (type === 'register') {
      return {
        id: credential.id,
        rawId: this._bufferToBase64(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: this._bufferToBase64(resp.clientDataJSON),
          attestationObject: this._bufferToBase64(resp.attestationObject),
        }
      }
    } else {
      return {
        id: credential.id,
        rawId: this._bufferToBase64(credential.rawId),
        type: credential.type || 'public-key',
        response: {
          clientDataJSON: this._bufferToBase64(resp.clientDataJSON),
          authenticatorData: this._bufferToBase64(resp.authenticatorData),
          signature: this._bufferToBase64(resp.signature),
          userHandle: resp.userHandle ? this._bufferToBase64(resp.userHandle) : null,
        }
      }
    }
  }

  _handleError(error) {
    if (error.name === 'NotAllowedError') {
      return { 
        success: false, 
        cancelled: true, 
        message: 'Authentication was cancelled' 
      }
    }
    if (error.name === 'InvalidStateError' || error.name === 'NotFoundError') {
      return { 
        success: false, 
        error: 'No passkey found. Please register a passkey first.' 
      }
    }
    return { 
      success: false, 
      error: error.message || 'Authentication failed' 
    }
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
