/**
 * Use Case: Update Inspection Status
 * Business logic for updating inspection status
 * Domain layer - no dependencies
 */
export class UpdateInspectionStatusUseCase {
  constructor({ inspectionRepository }) {
    this.inspectionRepository = inspectionRepository
  }

  async execute({ inspectionId, status, notes }) {
    if (!inspectionId) {
      throw new Error('Inspection ID is required')
    }

    if (!status) {
      throw new Error('Status is required')
    }

    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
    }

    try {
      const inspection = await this.inspectionRepository.updateStatus({
        inspectionId,
        status,
        notes
      })
      return inspection
    } catch (error) {
      throw new Error(`Failed to update inspection status: ${error.message}`)
    }
  }
}
