/**
 * Repository Interface: PermitApplicationRepository
 * Defines contract for permit application data access
 * Implemented by infrastructure layer
 */
export class PermitApplicationRepository {
  async review({ applicationId, decision, comments, reviewedDate }) {
    throw new Error('review method must be implemented')
  }

  async getApplications({ filters, pagination }) {
    throw new Error('getApplications method must be implemented')
  }

  async getApplicationById(id) {
    throw new Error('getApplicationById method must be implemented')
  }

  async getPendingApplications() {
    throw new Error('getPendingApplications method must be implemented')
  }
}
