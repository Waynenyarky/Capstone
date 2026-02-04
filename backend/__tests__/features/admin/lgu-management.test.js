/**
 * LGU Management Tests
 * Unit tests for the LGU model
 */

jest.mock('nodemailer', () => ({
  createTransport: () => ({
    sendMail: () => Promise.resolve(),
  }),
}))

const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

jest.setTimeout(60000)

describe('LGU Model Unit Tests', () => {
  let mongo
  let LGU

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test-secret'

    mongo = await MongoMemoryServer.create()
    const uri = mongo.getUri()
    await mongoose.connect(uri)

    // Define LGU schema inline for unit testing
    const LGUSchema = new mongoose.Schema(
      {
        code: {
          type: String,
          required: true,
          unique: true,
          uppercase: true,
          trim: true,
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        region: {
          type: String,
          required: true,
          trim: true,
        },
        province: {
          type: String,
          trim: true,
        },
        type: {
          type: String,
          enum: ['city', 'municipality', 'province', 'region'],
          default: 'city',
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
      { timestamps: true }
    )

    LGU = mongoose.model('LGUTest', LGUSchema)
  })

  afterAll(async () => {
    await mongoose.disconnect()
    if (mongo) await mongo.stop()
  })

  beforeEach(async () => {
    await LGU.deleteMany({})
  })

  describe('LGU Model', () => {
    it('should create an LGU with valid data', async () => {
      const lgu = await LGU.create({
        code: 'CEBU-CITY',
        name: 'Cebu City',
        region: 'Region VII',
        province: 'Cebu',
        type: 'city',
        isActive: true,
      })

      expect(lgu.code).toBe('CEBU-CITY')
      expect(lgu.name).toBe('Cebu City')
      expect(lgu.region).toBe('Region VII')
      expect(lgu.type).toBe('city')
      expect(lgu.isActive).toBe(true)
    })

    it('should enforce unique code', async () => {
      await LGU.create({
        code: 'MAKATI',
        name: 'Makati City',
        region: 'NCR',
        type: 'city',
      })

      await expect(
        LGU.create({
          code: 'MAKATI',
          name: 'Makati City Duplicate',
          region: 'NCR',
          type: 'city',
        })
      ).rejects.toThrow()
    })

    it('should uppercase code on save', async () => {
      const lgu = await LGU.create({
        code: 'manila-city',
        name: 'Manila City',
        region: 'NCR',
        type: 'city',
      })

      expect(lgu.code).toBe('MANILA-CITY')
    })

    it('should validate type enum', async () => {
      await expect(
        LGU.create({
          code: 'TEST',
          name: 'Test',
          region: 'NCR',
          type: 'invalid_type',
        })
      ).rejects.toThrow()
    })

    it('should require code field', async () => {
      await expect(
        LGU.create({
          name: 'Test LGU',
          region: 'NCR',
        })
      ).rejects.toThrow()
    })

    it('should require name field', async () => {
      await expect(
        LGU.create({
          code: 'TEST',
          region: 'NCR',
        })
      ).rejects.toThrow()
    })

    it('should require region field', async () => {
      await expect(
        LGU.create({
          code: 'TEST',
          name: 'Test LGU',
        })
      ).rejects.toThrow()
    })

    it('should default isActive to true', async () => {
      const lgu = await LGU.create({
        code: 'DEFAULT-ACTIVE',
        name: 'Default Active LGU',
        region: 'NCR',
      })

      expect(lgu.isActive).toBe(true)
    })

    it('should default type to city', async () => {
      const lgu = await LGU.create({
        code: 'DEFAULT-TYPE',
        name: 'Default Type LGU',
        region: 'NCR',
      })

      expect(lgu.type).toBe('city')
    })

    it('should allow all valid type values', async () => {
      const types = ['city', 'municipality', 'province', 'region']

      for (const type of types) {
        const lgu = await LGU.create({
          code: `TYPE-${type.toUpperCase()}`,
          name: `${type} LGU`,
          region: 'NCR',
          type,
        })
        expect(lgu.type).toBe(type)
      }
    })

    it('should query active LGUs', async () => {
      await LGU.create([
        { code: 'ACTIVE-1', name: 'Active 1', region: 'NCR', isActive: true },
        { code: 'ACTIVE-2', name: 'Active 2', region: 'NCR', isActive: true },
        { code: 'INACTIVE', name: 'Inactive', region: 'NCR', isActive: false },
      ])

      const activeLgus = await LGU.find({ isActive: true })
      expect(activeLgus.length).toBe(2)
    })

    it('should query by region', async () => {
      await LGU.create([
        { code: 'NCR-1', name: 'NCR City 1', region: 'NCR' },
        { code: 'NCR-2', name: 'NCR City 2', region: 'NCR' },
        { code: 'R7-1', name: 'Region 7 City', region: 'Region VII' },
      ])

      const ncrLgus = await LGU.find({ region: 'NCR' })
      expect(ncrLgus.length).toBe(2)
    })
  })
})
