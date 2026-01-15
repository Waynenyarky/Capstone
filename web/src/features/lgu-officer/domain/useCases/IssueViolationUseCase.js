/**
 * Use Case: Issue Violation
 * Business logic for issuing violations
 * Domain layer - no dependencies
 */
export class IssueViolationUseCase {
  constructor({ violationRepository }) {
    this.violationRepository = violationRepository
  }

  async execute({ inspectionId, businessId, type, severity, description, dueDate }) {
    if (!inspectionId) {
      throw new Error('Inspection ID is required')
    }

    if (!businessId) {
      throw new Error('Business ID is required')
    }

    if (!type || !severity || !description) {
      throw new Error('Type, severity, and description are required')
    }

    const validSeverities = ['minor', 'major', 'critical']
    if (!validSeverities.includes(severity)) {
      throw new Error(`Invalid severity. Must be one of: ${validSeverities.join(', ')}`)
    }

    try {
      const violation = await this.violationRepository.create({
        inspectionId,
        businessId,
        type,
        severity,
        description,
        dueDate,
        status: 'active',
        issuedDate: new Date()
      })
      return violation
    } catch (error) {
      throw new Error(`Failed to issue violation: ${error.message}`)
    }
  }
}
