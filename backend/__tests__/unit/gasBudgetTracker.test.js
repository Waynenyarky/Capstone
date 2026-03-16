/**
 * Unit tests for gasBudgetTracker.js - monthly gas budget monitoring
 */

const gasBudgetTracker = require('../../services/audit-service/src/lib/gasBudgetTracker')

describe('gasBudgetTracker', () => {
  beforeEach(() => {
    gasBudgetTracker.reset()
  })

  test('recordGasUsage tracks cumulative gas', () => {
    gasBudgetTracker.recordGasUsage(100000, 'logAuditHash')
    gasBudgetTracker.recordGasUsage(200000, 'logCriticalEvent')

    const status = gasBudgetTracker.getStatus()
    expect(status.gasUsed).toBe(300000)
    expect(status.txCount).toBe(2)
  })

  test('checkBudget returns allowed when under budget', () => {
    gasBudgetTracker.recordGasUsage(100000, 'test')
    const check = gasBudgetTracker.checkBudget(50000)
    expect(check.allowed).toBe(true)
    expect(check.remaining).toBeGreaterThan(0)
  })

  test('checkBudget returns not allowed when over budget', () => {
    // Default budget is 25_000_000
    gasBudgetTracker.recordGasUsage(25_000_000, 'test')
    const check = gasBudgetTracker.checkBudget(1)
    expect(check.allowed).toBe(false)
  })

  test('getStatus returns correct status levels', () => {
    // ok
    gasBudgetTracker.recordGasUsage(1000, 'test')
    expect(gasBudgetTracker.getStatus().status).toBe('ok')

    gasBudgetTracker.reset()

    // warning (80% of 25M = 20M)
    gasBudgetTracker.recordGasUsage(20_500_000, 'test')
    expect(gasBudgetTracker.getStatus().status).toBe('warning')

    gasBudgetTracker.reset()

    // critical (95% of 25M = 23.75M)
    gasBudgetTracker.recordGasUsage(24_000_000, 'test')
    expect(gasBudgetTracker.getStatus().status).toBe('critical')
  })

  test('getStatus includes month key', () => {
    gasBudgetTracker.recordGasUsage(1, 'test')
    const status = gasBudgetTracker.getStatus()
    expect(status.month).toMatch(/^\d{4}-\d{2}$/)
  })

  test('reset clears all counters', () => {
    gasBudgetTracker.recordGasUsage(5_000_000, 'test')
    gasBudgetTracker.reset()
    const status = gasBudgetTracker.getStatus()
    expect(status.gasUsed).toBe(0)
    expect(status.txCount).toBe(0)
  })
})
