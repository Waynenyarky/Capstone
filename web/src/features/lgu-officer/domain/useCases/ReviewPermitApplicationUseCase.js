/**
 * Use Case: Review Permit Application
 * Business logic for reviewing permit applications
 * Domain layer - no dependencies
 */
export class ReviewPermitApplicationUseCase {
  constructor({ permitApplicationRepository }) {
    this.permitApplicationRepository = permitApplicationRepository
  }

  async execute({ applicationId, decision, comments, reviewedDate }) {
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
      const result = await this.permitApplicationRepository.review({
        applicationId,
        decision,
        comments,
        reviewedDate: reviewedDate || new Date()
      })
      return result
    } catch (error) {
      throw new Error(`Failed to review permit application: ${error.message}`)
    }
  }
}
