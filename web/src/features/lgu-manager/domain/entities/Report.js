/**
 * Domain Entity: Report
 * Pure business logic entity - no dependencies
 */
export class Report {
  constructor({ id, type, title, data, generatedAt, status }) {
    this.id = id
    this.type = type
    this.title = title
    this.data = data
    this.generatedAt = generatedAt
    this.status = status
  }

  isValid() {
    return this.type && this.title && this.data
  }

  isComplete() {
    return this.status === 'complete'
  }
}
