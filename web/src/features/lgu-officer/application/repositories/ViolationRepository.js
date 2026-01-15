/**
 * Repository Interface: ViolationRepository
 * Defines contract for violation data access
 * Implemented by infrastructure layer
 */
export class ViolationRepository {
  async create({ inspectionId, businessId, type, severity, description, dueDate, status, issuedDate }) {
    throw new Error('create method must be implemented')
  }

  async getViolations({ filters, pagination }) {
    throw new Error('getViolations method must be implemented')
  }

  async getViolationById(id) {
    throw new Error('getViolationById method must be implemented')
  }

  async updateStatus({ violationId, status }) {
    throw new Error('updateStatus method must be implemented')
  }
}
