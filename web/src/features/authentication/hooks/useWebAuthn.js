import React from 'react'
import { registerStart, registerComplete, authenticateStart, authenticateComplete } from '@/features/authentication/services/webauthnService'
import { useNotifier } from '@/shared/notifications'

// Helpers to convert between base64url and ArrayBuffer
function base64ToBuffer(b64) {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'))
  const len = bin.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export default function useWebAuthn() {
  const { success } = useNotifier()

  const register = React.useCallback(async ({ email } = {}) => {
    if (!('credentials' in navigator)) throw new Error('WebAuthn not supported')
    const start = await registerStart({ email })
    // server should return publicKeyCredentialCreationOptions in base64url fields
    const pub = start.publicKey
    // convert challenge and user.id
    const publicKey = { ...pub }
    publicKey.challenge = base64ToBuffer(pub.challenge)
    if (pub.user && pub.user.id) publicKey.user = { ...pub.user, id: base64ToBuffer(pub.user.id) }

    const cred = await navigator.credentials.create({ publicKey })
    // Prepare attestation response for server
    const att = cred.response
    const payload = {
      id: cred.id,
      rawId: bufferToBase64(cred.rawId),
      type: cred.type,
      response: {
        clientDataJSON: bufferToBase64(att.clientDataJSON),
        attestationObject: bufferToBase64(att.attestationObject),
      }
    }
    const res = await registerComplete({ email, credential: payload })
    success('Passkey registered')
    return res
  }, [success])

  const authenticate = React.useCallback(async ({ email } = {}) => {
    if (!('credentials' in navigator)) throw new Error('WebAuthn not supported')
    const start = await authenticateStart({ email })
    const pub = start.publicKey
    const publicKey = { ...pub }
    publicKey.challenge = base64ToBuffer(pub.challenge)
    if (pub.allowCredentials) {
      publicKey.allowCredentials = pub.allowCredentials.map(c => ({ ...c, id: base64ToBuffer(c.id) }))
    }
    const cred = await navigator.credentials.get({ publicKey })
    const resp = cred.response
    const payload = {
      id: cred.id,
      rawId: bufferToBase64(cred.rawId),
      type: cred.type,
      response: {
        clientDataJSON: bufferToBase64(resp.clientDataJSON),
        authenticatorData: bufferToBase64(resp.authenticatorData),
        signature: bufferToBase64(resp.signature),
        userHandle: resp.userHandle ? bufferToBase64(resp.userHandle) : null,
      }
    }
    const result = await authenticateComplete({ email, credential: payload })
    success('Passkey authentication succeeded')
    return result
  }, [success])

  return { register, authenticate }
}
