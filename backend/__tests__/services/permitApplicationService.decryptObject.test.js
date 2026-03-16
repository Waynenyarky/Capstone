const permitApplicationService = require('../../services/admin-service/src/services/permitApplicationService')

describe('permitApplicationService decryptObject date handling', () => {
  const { decryptObject } = permitApplicationService.__testables

  it('preserves Date fields on top-level objects', () => {
    const submittedAt = new Date('2026-03-16T00:00:00.000Z')
    const input = {
      submittedAt,
      status: 'submitted',
    }

    const output = decryptObject(input)

    expect(output.submittedAt).toBeInstanceOf(Date)
    expect(output.submittedAt.toISOString()).toBe('2026-03-16T00:00:00.000Z')
    expect(output.status).toBe('submitted')
  })

  it('preserves nested Date fields and array Date fields', () => {
    const createdAt = new Date('2026-03-15T10:00:00.000Z')
    const reviewedAt = new Date('2026-03-16T11:30:00.000Z')

    const input = {
      timeline: {
        createdAt,
        history: [
          { reviewedAt },
        ],
      },
    }

    const output = decryptObject(input)

    expect(output.timeline.createdAt).toBeInstanceOf(Date)
    expect(output.timeline.createdAt.toISOString()).toBe('2026-03-15T10:00:00.000Z')
    expect(output.timeline.history[0].reviewedAt).toBeInstanceOf(Date)
    expect(output.timeline.history[0].reviewedAt.toISOString()).toBe('2026-03-16T11:30:00.000Z')
  })

  it('does not transform Date into empty object', () => {
    const submittedAt = new Date('2026-03-16T08:00:00.000Z')
    const output = decryptObject({ submittedAt })

    expect(output.submittedAt).not.toEqual({})
    expect(Object.prototype.toString.call(output.submittedAt)).toBe('[object Date]')
  })
})
