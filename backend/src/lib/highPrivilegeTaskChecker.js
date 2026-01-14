/**
 * High-Privilege Task Checker
 * Checks for active high-privilege tasks that need to be reassigned before admin deletion
 */

const AdminApproval = require('../models/AdminApproval')
const User = require('../models/User')

/**
 * Check for high-privilege tasks assigned to an admin
 * @param {string} adminId - Admin user ID
 * @returns {Promise<{hasTasks: boolean, tasks: Array, details: string}>}
 */
async function checkHighPrivilegeTasks(adminId) {
  const tasks = []
  let details = ''

  try {
    // 1. Check for pending admin approvals (system-wide approvals for permits, etc.)
    const pendingApprovals = await AdminApproval.find({
      requestedBy: adminId,
      status: 'pending',
    })
      .populate('userId', 'email firstName lastName')
      .lean()

    if (pendingApprovals.length > 0) {
      tasks.push({
        type: 'pending_approvals',
        count: pendingApprovals.length,
        items: pendingApprovals.map((a) => ({
          id: a.approvalId,
          type: a.requestType,
          userId: a.userId,
        })),
      })
      details += `${pendingApprovals.length} pending approval(s) (${pendingApprovals.map((a) => a.requestType).join(', ')}). `
    }

    // 2. Check for pending staff account changes
    const pendingStaffChanges = await AdminApproval.find({
      requestedBy: adminId,
      status: 'pending',
      requestType: { $in: ['account_status_change', 'role_change'] },
    })
      .populate('userId', 'email firstName lastName role office')
      .lean()

    if (pendingStaffChanges.length > 0) {
      tasks.push({
        type: 'pending_staff_changes',
        count: pendingStaffChanges.length,
        items: pendingStaffChanges.map((a) => ({
          id: a.approvalId,
          type: a.requestType,
          userId: a.userId,
        })),
      })
      details += `${pendingStaffChanges.length} pending staff account change(s). `
    }

    // 3. Check for active user role assignments (users created/modified by this admin recently)
    // This is a bit tricky - we'll check for users created/updated by this admin in the last 7 days
    // that are still active and might need attention
    const recentUserChanges = await User.find({
      $or: [
        { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        { updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      ],
      isActive: true,
    })
      .populate('role', 'slug name')
      .lean()

    // Note: This is a simplified check. In a real system, you'd track who created/modified users
    // For now, we'll just count recent active users as a potential concern
    if (recentUserChanges.length > 0) {
      const staffUsers = recentUserChanges.filter((u) => u.isStaff)
      if (staffUsers.length > 0) {
        tasks.push({
          type: 'recent_user_changes',
          count: staffUsers.length,
          note: 'Recent staff account creations/modifications may need attention',
        })
        details += `${staffUsers.length} recent staff account change(s) in last 7 days. `
      }
    }

    // 4. Check for scheduled system tasks
    // Note: This would require a separate Task/ScheduledJob model
    // For now, we'll skip this check or implement a placeholder
    // TODO: Implement when Task/ScheduledJob model exists

    const hasTasks = tasks.length > 0

    return {
      hasTasks,
      tasks,
      details: details.trim() || 'No high-privilege tasks found',
    }
  } catch (error) {
    console.error('Error checking high-privilege tasks:', error)
    // On error, assume tasks exist (fail safe)
    return {
      hasTasks: true,
      tasks: [],
      details: 'Error checking tasks - manual review required',
    }
  }
}

/**
 * Get summary of high-privilege tasks for display
 * @param {string} adminId - Admin user ID
 * @returns {Promise<Object>}
 */
async function getHighPrivilegeTasksSummary(adminId) {
  const result = await checkHighPrivilegeTasks(adminId)
  
  return {
    hasTasks: result.hasTasks,
    taskCount: result.tasks.reduce((sum, task) => sum + task.count, 0),
    taskTypes: result.tasks.map((task) => task.type),
    details: result.details,
  }
}

module.exports = {
  checkHighPrivilegeTasks,
  getHighPrivilegeTasksSummary,
}
