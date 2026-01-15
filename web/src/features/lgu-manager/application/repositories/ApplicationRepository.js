/**
 * Repository Interface: ApplicationRepository
 * Defines contract for application data access
 * Implemented by infrastructure layer
 */
export class ApplicationRepository {
  async review({ applicationId, decision, comments }) {
    throw new Error('review method must be implemented')
  }

  async getApplications({ filters, pagination }) {
    throw new Error('getApplications method must be implemented')
  }

  async getApplicationById(id) {
    throw new Error('getApplicationById method must be implemented')
  }
}
