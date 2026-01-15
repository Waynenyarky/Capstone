/**
 * Domain Entity: Inspection
 * Pure business logic entity - no dependencies
 */
export class Inspection {
  constructor({ id, businessId, type, status, scheduledDate, conductedDate, inspectorId, findings }) {
    this.id = id
    this.businessId = businessId
    this.type = type
    this.status = status
    this.scheduledDate = scheduledDate
    this.conductedDate = conductedDate
    this.inspectorId = inspectorId
    this.findings = findings || []
  }

  isValid() {
    return this.businessId && this.type && this.status
  }

  isCompleted() {
    return this.status === 'completed' && this.conductedDate
  }

  hasViolations() {
    return this.findings.some(f => f.type === 'violation')
  }
}
