/**
 * Domain Entity: Violation
 * Pure business logic entity - no dependencies
 */
export class Violation {
  constructor({ id, inspectionId, businessId, type, severity, description, status, issuedDate, dueDate }) {
    this.id = id
    this.inspectionId = inspectionId
    this.businessId = businessId
    this.type = type
    this.severity = severity
    this.description = description
    this.status = status
    this.issuedDate = issuedDate
    this.dueDate = dueDate
  }

  isValid() {
    return this.inspectionId && this.type && this.severity && this.description
  }

  isResolved() {
    return this.status === 'resolved'
  }

  isOverdue() {
    if (!this.dueDate) return false
    return new Date() > new Date(this.dueDate) && !this.isResolved()
  }
}
