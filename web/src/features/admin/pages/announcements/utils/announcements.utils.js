import dayjs from 'dayjs'

export const normalizeAnnouncementText = (value = '') => String(value).toLowerCase()

export function filterAnnouncements(announcements = [], search = '', statusFilter = null, priorityFilter = null) {
  let list = [...announcements]

  if (search.trim()) {
    const query = search.trim().toLowerCase()
    list = list.filter((record) => {
      const title = normalizeAnnouncementText(record?.title)
      const body = normalizeAnnouncementText(record?.body)
      return title.includes(query) || body.includes(query)
    })
  }

  if (statusFilter) {
    list = list.filter((record) => record?.status === statusFilter)
  }

  if (priorityFilter) {
    list = list.filter((record) => record?.priority === priorityFilter)
  }

  return list
}

export function filterAuditLogs(auditLogs = [], auditSearch = '') {
  const query = auditSearch.trim().toLowerCase()
  if (!query) return auditLogs

  return auditLogs.filter((log) => {
    const haystack = [
      log?.action,
      log?.userEmail,
      log?.fieldChanged,
      log?.oldValue,
      log?.newValue,
      log?.details,
      log?.description,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
}

export function getAnnouncementTitle(record) {
  return record?.title || '(Untitled)'
}

export function getAnnouncementStatusLabel(status) {
  return (status || 'draft').toUpperCase()
}

export function getAnnouncementPriorityLabel(priority) {
  return (priority || 'normal').toUpperCase()
}

export function formatAnnouncementDate(date, pattern = 'MMM D, YYYY') {
  return date ? dayjs(date).format(pattern) : '-'
}

export function getAuditActionLabel(action) {
  return action?.replace('announcement_', '').replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'
}
