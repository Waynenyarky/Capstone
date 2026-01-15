/**
 * Domain Entity: PasskeyCredential
 * Represents a passkey credential in the domain layer
 * This is a pure domain object with no dependencies on infrastructure
 */
export class PasskeyCredential {
  constructor({ credId, name, createdAt, lastUsedAt, transports = [] }) {
    this.credId = credId
    this.name = name || `Passkey ${credId?.substring(0, 8)}...`
    this.createdAt = createdAt ? new Date(createdAt) : new Date()
    this.lastUsedAt = lastUsedAt ? new Date(lastUsedAt) : null
    this.transports = transports
  }

  isActive() {
    return !!this.credId
  }

  getDisplayName() {
    return this.name
  }

  getShortId() {
    return this.credId?.substring(0, 20) || ''
  }
}
