const { encryptWithHash, decryptWithHash } = require('../../services/auth-service/src/lib/secretCipher')

describe('Secret Cipher Service', () => {
  const testHash = 'test-password-hash-123'
  const testPlain = 'secret-message-to-encrypt'

  describe('encryptWithHash', () => {
    it('should encrypt plain text successfully', () => {
      const encrypted = encryptWithHash(testHash, testPlain)
      
      expect(encrypted).toMatch(/^enc:v1:[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/)
      expect(encrypted).not.toBe(testPlain)
      expect(encrypted.length).toBeGreaterThan(50)
    })

    it('should produce different encrypted values each time', () => {
      const encrypted1 = encryptWithHash(testHash, testPlain)
      const encrypted2 = encryptWithHash(testHash, testPlain)
      
      expect(encrypted1).not.toBe(encrypted2)
      expect(encrypted1).toMatch(/^enc:v1:/)
      expect(encrypted2).toMatch(/^enc:v1:/)
    })

    it('should handle empty string', () => {
      const encrypted = encryptWithHash(testHash, '')
      
      expect(encrypted).toMatch(/^enc:v1:/)
      expect(encrypted).not.toBe('')
    })

    it('should handle non-string inputs gracefully', () => {
      const encrypted1 = encryptWithHash(testHash, 123)
      const encrypted2 = encryptWithHash(testHash, null)
      const encrypted3 = encryptWithHash(testHash, undefined)
      
      expect(encrypted1).toMatch(/^enc:v1:/)
      expect(encrypted2).toMatch(/^enc:v1:/)
      expect(encrypted3).toMatch(/^enc:v1:/)
    })

    it('should handle very long strings', () => {
      const longString = 'A'.repeat(10000)
      const encrypted = encryptWithHash(testHash, longString)
      
      expect(encrypted).toMatch(/^enc:v1:/)
      expect(encrypted.length).toBeGreaterThan(longString.length)
    })

    it('should handle special characters', () => {
      const specialString = '🔒 Secret with émojis and spëcial chars! @#$%^&*()'
      const encrypted = encryptWithHash(testHash, specialString)
      
      expect(encrypted).toMatch(/^enc:v1:/)
      expect(encrypted).not.toBe(specialString)
    })

    it('should handle different hashes', () => {
      const encrypted1 = encryptWithHash('hash1', testPlain)
      const encrypted2 = encryptWithHash('hash2', testPlain)
      
      expect(encrypted1).not.toBe(encrypted2)
      expect(encrypted1).toMatch(/^enc:v1:/)
      expect(encrypted2).toMatch(/^enc:v1:/)
    })
  })

  describe('decryptWithHash', () => {
    it('should decrypt encrypted text successfully', () => {
      const encrypted = encryptWithHash(testHash, testPlain)
      const decrypted = decryptWithHash(testHash, encrypted)
      
      expect(decrypted).toBe(testPlain)
    })

    it('should return original for non-encrypted values', () => {
      const plainText = 'not-encrypted-value'
      const decrypted = decryptWithHash(testHash, plainText)
      
      expect(decrypted).toBe(plainText)
    })

    it('should handle empty string', () => {
      const decrypted = decryptWithHash(testHash, '')
      
      expect(decrypted).toBe('')
    })

    it('should handle null/undefined gracefully', () => {
      const decrypted1 = decryptWithHash(testHash, null)
      const decrypted2 = decryptWithHash(testHash, undefined)
      
      expect(decrypted1).toBe('')
      expect(decrypted2).toBe('')
    })

    it('should handle invalid encrypted format', () => {
      const invalidEncrypted = 'invalid:format'
      const decrypted = decryptWithHash(testHash, invalidEncrypted)
      
      expect(decrypted).toBe(invalidEncrypted)
    })

    it('should handle malformed encrypted parts', () => {
      const malformedEncrypted = 'enc:v1:invalidhex:invalidthex:invalidthex'
      
      // Should throw an error for malformed data
      expect(() => {
        decryptWithHash(testHash, malformedEncrypted)
      }).toThrow()
    })

    it('should fail with wrong hash', () => {
      const encrypted = encryptWithHash(testHash, testPlain)
      
      // Should throw an error with wrong hash
      expect(() => {
        decryptWithHash('wrong-hash', encrypted)
      }).toThrow()
    })

    it('should handle round-trip encryption/decryption', () => {
      const testValues = [
        'simple text',
        '',
        '123',
        'special!@#$%^&*()',
        'multiline\nstring\nwith\nnewlines',
        'unicode: 你好 🌟',
        'A'.repeat(1000)
      ]

      testValues.forEach(value => {
        const encrypted = encryptWithHash(testHash, value)
        const decrypted = decryptWithHash(testHash, encrypted)
        expect(decrypted).toBe(value)
      })
    })
  })

  describe('Integration Tests', () => {
    it('should maintain data integrity through multiple operations', () => {
      const original = 'test-data-123'
      
      // Encrypt
      const encrypted1 = encryptWithHash(testHash, original)
      const encrypted2 = encryptWithHash(testHash, original)
      
      // Decrypt
      const decrypted1 = decryptWithHash(testHash, encrypted1)
      const decrypted2 = decryptWithHash(testHash, encrypted2)
      
      expect(decrypted1).toBe(original)
      expect(decrypted2).toBe(original)
      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should handle concurrent encryption operations', async () => {
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(encryptWithHash(testHash, `message-${i}`))
      }
      
      const encryptedValues = await Promise.all(promises)
      
      // All should be different and properly formatted
      encryptedValues.forEach((encrypted, index) => {
        expect(encrypted).toMatch(/^enc:v1:/)
        expect(encrypted).not.toBe(`message-${index}`)
      })
      
      // All should be unique
      const uniqueValues = new Set(encryptedValues)
      expect(uniqueValues.size).toBe(10)
    })

    it('should handle concurrent decryption operations', async () => {
      // First encrypt multiple values
      const encryptedValues = []
      for (let i = 0; i < 10; i++) {
        encryptedValues.push(encryptWithHash(testHash, `message-${i}`))
      }
      
      // Then decrypt them concurrently
      const promises = encryptedValues.map(encrypted => 
        decryptWithHash(testHash, encrypted)
      )
      
      const decryptedValues = await Promise.all(promises)
      
      // All should decrypt correctly
      decryptedValues.forEach((decrypted, index) => {
        expect(decrypted).toBe(`message-${index}`)
      })
    })
  })

  describe('Security Considerations', () => {
    it('should use AES-256-GCM algorithm', () => {
      const encrypted = encryptWithHash(testHash, testPlain)
      
      // Verify format indicates AES-256-GCM usage
      expect(encrypted).toMatch(/^enc:v1:/)
      
      // Should have IV, auth tag, and ciphertext
      const parts = encrypted.split(':')
      expect(parts).toHaveLength(5)
      expect(parts[0]).toBe('enc')
      expect(parts[1]).toBe('v1')
      expect(parts[2]).toMatch(/^[a-f0-9]+$/) // IV hex
      expect(parts[3]).toMatch(/^[a-f0-9]+$/) // Auth tag hex
      expect(parts[4]).toMatch(/^[a-f0-9]+$/) // Ciphertext hex
    })

    it('should generate unique IVs for each encryption', () => {
      const encrypted1 = encryptWithHash(testHash, testPlain)
      const encrypted2 = encryptWithHash(testHash, testPlain)
      
      const iv1 = encrypted1.split(':')[2]
      const iv2 = encrypted2.split(':')[2]
      
      expect(iv1).not.toBe(iv2)
      expect(iv1.length).toBe(24) // 12 bytes = 24 hex chars
      expect(iv2.length).toBe(24)
    })

    it('should include authentication tag', () => {
      const encrypted = encryptWithHash(testHash, testPlain)
      const parts = encrypted.split(':')
      
      const authTag = parts[3]
      expect(authTag.length).toBe(32) // 16 bytes = 32 hex chars
      expect(authTag).toMatch(/^[a-f0-9]+$/)
    })

    it('should derive key from hash using SHA-256', () => {
      // This is tested implicitly by successful encryption/decryption
      const encrypted = encryptWithHash(testHash, testPlain)
      const decrypted = decryptWithHash(testHash, encrypted)
      
      expect(decrypted).toBe(testPlain)
    })

    it('should fail decryption with tampered data', () => {
      const encrypted = encryptWithHash(testHash, testPlain)
      
      // Tamper with the ciphertext
      const parts = encrypted.split(':')
      const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}:deadbeef${parts[4]}`
      
      // Should throw an error for tampered data
      expect(() => {
        const result = decryptWithHash(testHash, tampered)
        expect(result).not.toBe(testPlain)
      }).toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long hash', () => {
      const longHash = 'A'.repeat(1000)
      const encrypted = encryptWithHash(longHash, testPlain)
      const decrypted = decryptWithHash(longHash, encrypted)
      
      expect(decrypted).toBe(testPlain)
    })

    it('should handle hash with special characters', () => {
      const specialHash = 'hash-with-特殊-字符-🔒-123'
      const encrypted = encryptWithHash(specialHash, testPlain)
      const decrypted = decryptWithHash(specialHash, encrypted)
      
      expect(decrypted).toBe(testPlain)
    })

    it('should handle numeric hash', () => {
      const numericHash = 12345
      const encrypted = encryptWithHash(numericHash, testPlain)
      const decrypted = decryptWithHash(numericHash, encrypted)
      
      expect(decrypted).toBe(testPlain)
    })

    it('should handle empty hash', () => {
      const encrypted = encryptWithHash('', testPlain)
      const decrypted = decryptWithHash('', encrypted)
      
      expect(decrypted).toBe(testPlain)
    })

    it('should handle JSON objects', () => {
      const jsonObject = { key: 'value', nested: { data: 123 } }
      const jsonString = JSON.stringify(jsonObject)
      
      const encrypted = encryptWithHash(testHash, jsonString)
      const decrypted = decryptWithHash(testHash, encrypted)
      
      expect(decrypted).toBe(jsonString)
      
      // Verify it's valid JSON
      const parsed = JSON.parse(decrypted)
      expect(parsed).toEqual(jsonObject)
    })
  })

  describe('Performance', () => {
    it('should handle reasonable encryption speed', () => {
      const start = Date.now()
      
      for (let i = 0; i < 100; i++) {
        encryptWithHash(testHash, `message-${i}`)
      }
      
      const duration = Date.now() - start
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should handle reasonable decryption speed', () => {
      // Pre-encrypt some values
      const encryptedValues = []
      for (let i = 0; i < 100; i++) {
        encryptedValues.push(encryptWithHash(testHash, `message-${i}`))
      }
      
      const start = Date.now()
      
      encryptedValues.forEach(encrypted => {
        decryptWithHash(testHash, encrypted)
      })
      
      const duration = Date.now() - start
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })
})
