/**
 * Unit tests for field-level encryption (fieldCipher + encryptionPlugin)
 */
const crypto = require('crypto')

// Set encryption key BEFORE requiring modules
process.env.FIELD_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex')

const { encrypt, encryptDeterministic, decrypt, isEncrypted } = require('../../shared/lib/fieldCipher')

describe('fieldCipher', () => {
  describe('encrypt / decrypt (randomized)', () => {
    it('encrypts and decrypts a string', () => {
      const plain = 'Juan Dela Cruz'
      const encrypted = encrypt(plain)
      expect(encrypted).not.toBe(plain)
      expect(encrypted.startsWith('enc:v2:')).toBe(true)
      expect(decrypt(encrypted)).toBe(plain)
    })

    it('produces different ciphertext each time (randomized)', () => {
      const plain = 'test@example.com'
      const enc1 = encrypt(plain)
      const enc2 = encrypt(plain)
      expect(enc1).not.toBe(enc2)
      expect(decrypt(enc1)).toBe(plain)
      expect(decrypt(enc2)).toBe(plain)
    })

    it('returns null/empty as-is', () => {
      expect(encrypt(null)).toBe(null)
      expect(encrypt('')).toBe('')
      expect(encrypt(undefined)).toBe(undefined)
      expect(decrypt(null)).toBe(null)
      expect(decrypt('')).toBe('')
    })

    it('does not double-encrypt', () => {
      const plain = 'hello'
      const enc = encrypt(plain)
      const doubleEnc = encrypt(enc)
      expect(doubleEnc).toBe(enc)
      expect(decrypt(doubleEnc)).toBe(plain)
    })
  })

  describe('encryptDeterministic', () => {
    it('produces the same ciphertext for the same input', () => {
      const plain = 'admin@bizclear.gov.ph'
      const enc1 = encryptDeterministic(plain)
      const enc2 = encryptDeterministic(plain)
      expect(enc1).toBe(enc2)
      expect(enc1.startsWith('det:v2:')).toBe(true)
      expect(decrypt(enc1)).toBe(plain)
    })

    it('produces different ciphertext for different inputs', () => {
      const enc1 = encryptDeterministic('alice@test.com')
      const enc2 = encryptDeterministic('bob@test.com')
      expect(enc1).not.toBe(enc2)
    })

    it('does not double-encrypt deterministic values', () => {
      const enc = encryptDeterministic('test')
      expect(encryptDeterministic(enc)).toBe(enc)
    })
  })

  describe('isEncrypted', () => {
    it('detects randomized encrypted strings', () => {
      expect(isEncrypted(encrypt('hello'))).toBe(true)
    })

    it('detects deterministic encrypted strings', () => {
      expect(isEncrypted(encryptDeterministic('hello'))).toBe(true)
    })

    it('returns false for plain strings', () => {
      expect(isEncrypted('hello')).toBe(false)
      expect(isEncrypted('')).toBe(false)
      expect(isEncrypted(null)).toBe(false)
      expect(isEncrypted(123)).toBe(false)
    })
  })

  describe('unicode and special characters', () => {
    it('handles unicode strings', () => {
      const plain = 'José María García 日本語テスト 🇵🇭'
      const encrypted = encrypt(plain)
      expect(decrypt(encrypted)).toBe(plain)
    })

    it('handles long strings', () => {
      const plain = 'A'.repeat(10000)
      const encrypted = encrypt(plain)
      expect(decrypt(encrypted)).toBe(plain)
    })
  })
})

describe('encryptionPlugin (Mongoose integration)', () => {
  // We test the plugin logic without a real MongoDB by simulating Mongoose hooks
  const { encryptionPlugin } = require('../../shared/lib/encryptionPlugin')

  // Minimal schema mock that captures hooks
  function createMockSchema() {
    const hooks = { pre: {}, post: {} }
    return {
      _hooks: hooks,
      pre(events, fn) {
        const eventList = Array.isArray(events) ? events : [events]
        for (const e of eventList) {
          hooks.pre[e] = hooks.pre[e] || []
          hooks.pre[e].push(fn)
        }
      },
      post(events, fn) {
        const eventList = Array.isArray(events) ? events : [events]
        for (const e of eventList) {
          hooks.post[e] = hooks.post[e] || []
          hooks.post[e].push(fn)
        }
      },
    }
  }

  it('registers pre and post hooks', () => {
    const schema = createMockSchema()
    encryptionPlugin(schema, { fields: ['name'] })
    expect(schema._hooks.pre.save).toBeDefined()
    expect(schema._hooks.post.find).toBeDefined()
    expect(schema._hooks.post.findOne).toBeDefined()
    expect(schema._hooks.post.save).toBeDefined()
  })

  it('encrypts fields on pre-save and decrypts on post-find', async () => {
    const schema = createMockSchema()
    encryptionPlugin(schema, {
      fields: ['firstName', 'lastName'],
      deterministicFields: ['email'],
    })

    // Simulate a document
    const doc = {
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      email: 'juan@test.com',
    }

    // Run pre-save hooks (async)
    for (const hook of schema._hooks.pre.save) {
      await hook.call(doc)
    }

    // Fields should be encrypted
    expect(doc.firstName.startsWith('enc:v2:')).toBe(true)
    expect(doc.lastName.startsWith('enc:v2:')).toBe(true)
    expect(doc.email.startsWith('det:v2:')).toBe(true)

    // Run post-find hooks (simulating array result)
    const docs = [doc]
    for (const hook of schema._hooks.post.find) {
      hook.call(null, docs)
    }

    // Fields should be decrypted
    expect(docs[0].firstName).toBe('Juan')
    expect(docs[0].lastName).toBe('Dela Cruz')
    expect(docs[0].email).toBe('juan@test.com')
  })

  it('handles nested paths', async () => {
    const schema = createMockSchema()
    encryptionPlugin(schema, {
      nestedPaths: ['address'],
    })

    const doc = {
      address: {
        street: '123 Main St',
        city: 'Manila',
        nested: { barangay: 'San Miguel' },
      },
    }

    for (const hook of schema._hooks.pre.save) {
      await hook.call(doc)
    }

    expect(isEncrypted(doc.address.street)).toBe(true)
    expect(isEncrypted(doc.address.city)).toBe(true)
    expect(isEncrypted(doc.address.nested.barangay)).toBe(true)

    // Decrypt via post-findOne
    for (const hook of schema._hooks.post.findOne) {
      hook.call(null, doc)
    }

    expect(doc.address.street).toBe('123 Main St')
    expect(doc.address.city).toBe('Manila')
    expect(doc.address.nested.barangay).toBe('San Miguel')
  })

  it('handles mixed paths (deep object encryption)', async () => {
    const schema = createMockSchema()
    encryptionPlugin(schema, {
      mixedPaths: ['metadata'],
    })

    const doc = {
      metadata: {
        ipAddress: '192.168.1.1',
        deep: { reason: 'test reason' },
      },
    }

    for (const hook of schema._hooks.pre.save) {
      await hook.call(doc)
    }

    expect(isEncrypted(doc.metadata.ipAddress)).toBe(true)
    expect(isEncrypted(doc.metadata.deep.reason)).toBe(true)

    for (const hook of schema._hooks.post.findOne) {
      hook.call(null, doc)
    }

    expect(doc.metadata.ipAddress).toBe('192.168.1.1')
    expect(doc.metadata.deep.reason).toBe('test reason')
  })

  it('skips encryption when FIELD_ENCRYPTION_KEY is not set', async () => {
    const originalKey = process.env.FIELD_ENCRYPTION_KEY
    delete process.env.FIELD_ENCRYPTION_KEY

    const schema = createMockSchema()
    encryptionPlugin(schema, { fields: ['name'] })

    const doc = { name: 'Test' }
    for (const hook of schema._hooks.pre.save) {
      await hook.call(doc)
    }

    // Should remain plaintext
    expect(doc.name).toBe('Test')

    // Restore key
    process.env.FIELD_ENCRYPTION_KEY = originalKey
  })

  it('handles arrayPaths with subdocuments', async () => {
    const schema = createMockSchema()
    encryptionPlugin(schema, {
      arrayPaths: ['checklist'],
    })

    const doc = {
      checklist: [
        { label: 'Fire exit', remarks: 'Needs repair' },
        { label: 'Sanitation', remarks: '' },
      ],
    }

    for (const hook of schema._hooks.pre.save) {
      await hook.call(doc)
    }

    expect(isEncrypted(doc.checklist[0].label)).toBe(true)
    expect(isEncrypted(doc.checklist[0].remarks)).toBe(true)
    expect(doc.checklist[1].remarks).toBe('') // empty stays empty

    for (const hook of schema._hooks.post.findOne) {
      hook.call(null, doc)
    }

    expect(doc.checklist[0].label).toBe('Fire exit')
    expect(doc.checklist[0].remarks).toBe('Needs repair')
  })
})
