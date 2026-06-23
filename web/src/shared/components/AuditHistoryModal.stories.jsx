import AuditHistoryModal from './AuditHistoryModal'

export default {
  title: 'Shared/AuditHistoryModal',
  component: AuditHistoryModal,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    onClose: { action: 'closed' },
    auditLogs: { control: 'object' },
  },
}

const mockAuditLogs = [
  {
    _id: '1',
    eventType: 'Fee Created',
    userId: 'admin',
    userName: 'Admin User',
    timestamp: '2024-01-15T10:30:00Z',
    details: { name: 'Mayor\'s Permit Fee', amount: 500 },
  },
  {
    _id: '2',
    eventType: 'Amount Changed',
    userId: 'admin',
    userName: 'Admin User',
    timestamp: '2024-02-01T14:20:00Z',
    details: { amount: 550, previousAmount: 500 },
  },
  {
    _id: '3',
    eventType: 'Fee Disabled',
    userId: 'admin',
    userName: 'Admin User',
    timestamp: '2024-03-10T09:15:00Z',
    details: { reason: 'Deprecated' },
  },
  {
    _id: '4',
    eventType: 'Fee Enabled',
    userId: 'admin',
    userName: 'Admin User',
    timestamp: '2024-04-05T11:00:00Z',
    details: { reason: 'Re-enabled for new policy' },
  },
  {
    _id: '5',
    eventType: 'Description Updated',
    userId: 'admin',
    userName: 'Admin User',
    timestamp: '2024-05-20T16:45:00Z',
    details: { description: 'Updated description for clarity' },
  },
]

export const Default = {
  args: {
    open: true,
    onClose: () => {},
    auditLogs: mockAuditLogs,
  },
}

export const Empty = {
  args: {
    open: true,
    onClose: () => {},
    auditLogs: [],
  },
}

export const SingleLog = {
  args: {
    open: true,
    onClose: () => {},
    auditLogs: [mockAuditLogs[0]],
  },
}

export const ManyLogs = {
  args: {
    open: true,
    onClose: () => {},
    auditLogs: Array.from({ length: 25 }, (_, i) => ({
      _id: `${i + 1}`,
      eventType: i % 2 === 0 ? 'updated' : 'created',
      userId: 'admin',
      userName: 'Admin User',
      timestamp: new Date(2024, 0, i + 1).toISOString(),
      details: { index: i },
    })),
  },
}

export const WithSearch = {
  args: {
    open: true,
    onClose: () => {},
    auditLogs: [
      ...mockAuditLogs,
      {
        _id: '6',
        eventType: 'deleted',
        userId: 'user123',
        userName: 'John Doe',
        timestamp: '2024-06-01T08:00:00Z',
        details: { reason: 'User requested deletion' },
      },
      {
        _id: '7',
        eventType: 'created',
        userId: 'user456',
        userName: 'Jane Smith',
        timestamp: '2024-06-02T09:30:00Z',
        details: { name: 'New Fee' },
      },
    ],
  },
}
