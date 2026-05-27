import { Empty, Modal, Typography } from 'antd'
import dayjs from 'dayjs'

const { Text } = Typography

export default function AnnouncementModals({
  unpublishModalVisible,
  onCloseUnpublish,
  onConfirmUnpublish,
  saving,
  selected,
  deleteModalVisible,
  onCloseDelete,
  onConfirmDelete,
  auditLogModalVisible,
  onCloseAuditLog,
  selectedAuditLog,
  infoOpen,
  onCloseInfo,
  token,
}) {
  return (
    <>
      <Modal
        title="Unpublish Announcement"
        open={unpublishModalVisible}
        onOk={onConfirmUnpublish}
        onCancel={onCloseUnpublish}
        okText="Unpublish"
        cancelText="Cancel"
        confirmLoading={saving}
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to unpublish this announcement?</p>
        <p>This will move the announcement back to draft status and it will no longer appear on the landing page.</p>
        {selected && (
          <div style={{ marginTop: 16, padding: 12, background: token.colorBgLayout, borderRadius: 6 }}>
            <Text strong>{selected.title}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Created: {selected.createdAt ? dayjs(selected.createdAt).format('MMM D, YYYY') : '-'}
            </Text>
          </div>
        )}
      </Modal>

      <Modal
        title="Delete Announcement"
        open={deleteModalVisible}
        onOk={onConfirmDelete}
        onCancel={onCloseDelete}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        confirmLoading={saving}
      >
        <p>Are you sure you want to delete this announcement draft?</p>
        <p>This action cannot be undone.</p>
        {selected && (
          <div style={{ marginTop: 16, padding: 12, background: token.colorBgLayout, borderRadius: 6 }}>
            <Text strong>{selected.title || '(Untitled)'}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Created: {selected.createdAt ? dayjs(selected.createdAt).format('MMM D, YYYY') : '-'}
            </Text>
          </div>
        )}
      </Modal>

      <Modal
        title="Audit Entry Details"
        open={auditLogModalVisible}
        onOk={onCloseAuditLog}
        onCancel={onCloseAuditLog}
        footer={null}
      >
        {selectedAuditLog ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <Text strong>Event:</Text> {selectedAuditLog.action}
            </div>
            <div>
              <Text strong>User:</Text> {selectedAuditLog.userEmail || 'Unknown'}
            </div>
            <div>
              <Text strong>Date:</Text> {selectedAuditLog.createdAt ? dayjs(selectedAuditLog.createdAt).format('MMM D, YYYY h:mm A') : '-'}
            </div>
            <div>
              <Text strong>Field:</Text> {selectedAuditLog.fieldChanged || '-'}
            </div>
            <div>
              <Text strong>Old Value:</Text>
              <div style={{ marginTop: 4 }}>
                <Text code>{selectedAuditLog.oldValue || '-'}</Text>
              </div>
            </div>
            <div>
              <Text strong>New Value:</Text>
              <div style={{ marginTop: 4 }}>
                <Text code>{selectedAuditLog.newValue || '-'}</Text>
              </div>
            </div>
            <div>
              <Text strong>Details:</Text>
              <div style={{ marginTop: 4 }}>
                <Text>{selectedAuditLog.details || '-'}</Text>
              </div>
            </div>
          </div>
        ) : (
          <Empty description="No audit details available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Modal>

      <Modal
        title="Announcements"
        open={infoOpen}
        onOk={onCloseInfo}
        onCancel={onCloseInfo}
        footer={null}
      >
        <p>Use announcements to post important updates to the public landing page. Drafts can be prepared, scheduled for future publication, and set to expire after they are no longer relevant.</p>
        <p>Once an announcement is posted or becomes visible, it can no longer be deleted. Published announcements can be unpublished to remove them from public view.</p>
        <p>Announcements can also be filtered by status and priority while editing.</p>
      </Modal>
    </>
  )
}
