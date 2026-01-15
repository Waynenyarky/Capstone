/**
 * Repository Interface: InspectionRepository
 * Defines contract for inspection data access
 * Implemented by infrastructure layer
 */
export class InspectionRepository {
  async conduct({ inspectionId, findings, notes, conductedDate }) {
    throw new Error('conduct method must be implemented')
  }

  async getInspections({ filters, pagination }) {
    throw new Error('getInspections method must be implemented')
  }

  async getInspectionById(id) {
    throw new Error('getInspectionById method must be implemented')
  }

  async updateStatus({ inspectionId, status, notes }) {
    throw new Error('updateStatus method must be implemented')
  }

  async schedule({ businessId, type, scheduledDate, inspectorId }) {
    throw new Error('schedule method must be implemented')
  }
}
