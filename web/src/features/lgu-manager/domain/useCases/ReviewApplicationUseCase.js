/**
 * Use Case: Review Application
 * Business logic for application review
 * Domain layer - no dependencies
 */
export class ReviewApplicationUseCase {
  constructor({ applicationRepository }) {
    this.applicationRepository = applicationRepository
  }

  async execute({ applicationId, decision, comments }) {
    if (!applicationId) {
      throw new Error('Application ID is required')
    }

    if (!decision) {
      throw new Error('Decision is required')
    }

    const validDecisions = ['approve', 'reject', 'request_revision']
    if (!validDecisions.includes(decision)) {
      throw new Error(`Invalid decision. Must be one of: ${validDecisions.join(', ')}`)
    }

    try {
      const result = await this.applicationRepository.review({
        applicationId,
        decision,
        comments
      })
      return result
    } catch (error) {
      throw new Error(`Failed to review application: ${error.message}`)
    }
  }
}
