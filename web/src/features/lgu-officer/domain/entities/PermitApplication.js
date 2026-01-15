/**
 * Domain Entity: PermitApplication
 * Pure business logic entity - no dependencies
 */
export class PermitApplication {
  constructor({ id, businessId, type, status, submittedDate, reviewedDate, documents, requirements }) {
    this.id = id
    this.businessId = businessId
    this.type = type
    this.status = status
    this.submittedDate = submittedDate
    this.reviewedDate = reviewedDate
    this.documents = documents || []
    this.requirements = requirements || []
  }

  isValid() {
    return this.businessId && this.type && this.status
  }

  isPending() {
    return this.status === 'pending' || this.status === 'under_review'
  }

  isApproved() {
    return this.status === 'approved'
  }

  hasAllRequirements() {
    return this.requirements.every(req => req.completed === true)
  }
}
