/**
 * Unit tests for optional virus scanning (backend/shared/fileScan.js).
 * When CLAMAV_HOST is unset, scanFile resolves with { clean: true }.
 * When set, behavior depends on mocked ClamAV client.
 */

const path = require('path')
const fs = require('fs')
const os = require('os')

jest.mock('clamdjs', () => ({
  createScanner: jest.fn(),
  isCleanReply: jest.fn()
}))

const clamdjs = require('clamdjs')

describe('fileScan', () => {
  const originalEnv = process.env.CLAMAV_HOST

  afterEach(() => {
    process.env.CLAMAV_HOST = originalEnv
  })

  describe('when CLAMAV_HOST is not set', () => {
    it('scanFile resolves with { clean: true }', async () => {
      delete process.env.CLAMAV_HOST
      const { scanFile } = require('../../shared/fileScan')
      const result = await scanFile('/any/path')
      expect(result).toEqual({ clean: true })
    })

    it('isScanConfigured returns false', () => {
      delete process.env.CLAMAV_HOST
      const { isScanConfigured } = require('../../shared/fileScan')
      expect(isScanConfigured()).toBe(false)
    })
  })

  describe('when CLAMAV_HOST is set', () => {
    let tempDir

    beforeAll(() => {
      tempDir = fs.mkdirSync(path.join(os.tmpdir(), `fileScan-${Date.now()}`), { recursive: true })
    })

    afterAll(() => {
      try { fs.rmSync(tempDir, { recursive: true }) } catch (_) {}
    })

    it('scanFile returns { clean: true } when daemon reports clean', async () => {
      process.env.CLAMAV_HOST = 'localhost'
      clamdjs.createScanner.mockReturnValue({
        scanFile: jest.fn().mockResolvedValue('OK')
      })
      clamdjs.isCleanReply.mockReturnValue(true)

      delete require.cache[require.resolve('../../shared/fileScan')]
      const { scanFile } = require('../../shared/fileScan')
      const tempFile = path.join(tempDir, 'clean.txt')
      fs.writeFileSync(tempFile, 'clean content')

      const result = await scanFile(tempFile)
      expect(result).toEqual({ clean: true })
    })

    it('scanFile returns { clean: false } when daemon reports infected', async () => {
      process.env.CLAMAV_HOST = 'localhost'
      clamdjs.createScanner.mockReturnValue({
        scanFile: jest.fn().mockResolvedValue('stream: Eicar-Test-Signature FOUND')
      })
      clamdjs.isCleanReply.mockReturnValue(false)

      delete require.cache[require.resolve('../../shared/fileScan')]
      const { scanFile } = require('../../shared/fileScan')
      const tempFile = path.join(tempDir, 'infected.txt')
      fs.writeFileSync(tempFile, 'eicar')

      const result = await scanFile(tempFile)
      expect(result).toEqual({ clean: false, error: 'infected' })
    })

    it('scanFile returns { clean: false } on scan error (fail closed)', async () => {
      process.env.CLAMAV_HOST = 'localhost'
      clamdjs.createScanner.mockReturnValue({
        scanFile: jest.fn().mockRejectedValue(new Error('Connection refused'))
      })

      delete require.cache[require.resolve('../../shared/fileScan')]
      const { scanFile } = require('../../shared/fileScan')
      const tempFile = path.join(tempDir, 'err.txt')
      fs.writeFileSync(tempFile, 'x')

      const result = await scanFile(tempFile)
      expect(result.clean).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('isScanConfigured returns true', () => {
      process.env.CLAMAV_HOST = 'localhost'
      const { isScanConfigured } = require('../../shared/fileScan')
      expect(isScanConfigured()).toBe(true)
    })
  })
})
