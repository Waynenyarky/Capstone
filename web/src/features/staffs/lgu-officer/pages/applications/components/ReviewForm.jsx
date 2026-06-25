import { Form, Radio, Select, Input, Button, Tooltip, Typography } from 'antd'
import { theme } from 'antd'
import { COMMENT_OPTIONS, COMMENT_OTHER_CODE, REQUEST_OPTIONS, REQUEST_OTHER_CODE, REJECTION_REASON_OPTIONS } from '../../../constants/rejectionReasons'

const { TextArea } = Input
const { Text } = Typography

export default function ReviewForm({
  form,
  decision,
  onDecisionChange,
  onSubmit,
  reviewing,
  canReview,
  allFieldKeys,
  allFieldsReviewed,
  decidedCount,
  rejectedFields,
}) {
  const { token } = theme.useToken()

  return (
    <Form form={form} layout="vertical" onFinish={onSubmit}>
      <Form.Item
        label={<Text type="secondary" style={{ fontSize: 12 }}>Decision</Text>}
        name="decision"
        rules={[{ required: true, message: 'Please select a decision' }]}
      >
        <Radio.Group onChange={onDecisionChange} value={decision} style={{ width: '100%' }}>
          <Radio.Button 
            value="approve" 
            disabled={rejectedFields.length > 0}
          >
            Approve
          </Radio.Button>
          <Radio.Button value="reject">Reject</Radio.Button>
          <Radio.Button 
            value="request_changes"
            disabled={rejectedFields.length === 0}
          >
            Request Changes
          </Radio.Button>
        </Radio.Group>
      </Form.Item>

      {decision === 'approve' && (
        <>
          <Form.Item 
            label={<Text type="secondary" style={{ fontSize: 12 }}>Comments</Text>} 
            name="commentsCode" 
          >
            <Select
              placeholder="Select comment (optional)"
              options={COMMENT_OPTIONS}
              style={{ fontSize: 13, fontFamily: token.fontFamily }}
            />
          </Form.Item>
          
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.commentsCode !== curr.commentsCode}>
            {({ getFieldValue }) => 
              getFieldValue('commentsCode') === COMMENT_OTHER_CODE ? (
                <Form.Item 
                  label={<Text type="secondary" style={{ fontSize: 12 }}>Specify Comments</Text>}
                  name="commentsOther"
                >
                  <TextArea 
                    rows={3} 
                    placeholder="Add detailed comments..."
                    style={{ fontSize: 13 }} 
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </>
      )}

      {decision === 'reject' && (
        <>
          <Form.Item 
            label={<Text type="secondary" style={{ fontSize: 12 }}>Rejection Reason</Text>} 
            name="rejectionReasonCode" 
            rules={[{ required: true, message: 'Please select a rejection reason' }]}
          >
            <Select
              placeholder="Select rejection reason"
              options={REJECTION_REASON_OPTIONS}
              style={{ fontSize: 13, fontFamily: token.fontFamily }}
            />
          </Form.Item>
          
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.rejectionReasonCode !== curr.rejectionReasonCode}>
            {({ getFieldValue }) => 
              getFieldValue('rejectionReasonCode') === 'other' ? (
                <Form.Item 
                  label={<Text type="secondary" style={{ fontSize: 12 }}>Specify Reason</Text>}
                  name="rejectionReasonOther"
                  rules={[{ required: true, message: 'Please specify the reason' }]}
                >
                  <TextArea 
                    rows={2} 
                    placeholder="Please specify the reason for rejection..." 
                    style={{ fontSize: 13 }} 
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </>
      )}

      {decision === 'request_changes' && (
        <>
          <Form.Item 
            label={<Text type="secondary" style={{ fontSize: 12 }}>Requests</Text>} 
            name="requestsCode" 
            rules={[{ required: true, message: 'Please specify what changes are needed' }]}
          >
            <Select
              placeholder="Select request type"
              options={REQUEST_OPTIONS}
              style={{ fontSize: 13, fontFamily: token.fontFamily }}
            />
          </Form.Item>
          
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.requestsCode !== curr.requestsCode}>
            {({ getFieldValue }) => 
              getFieldValue('requestsCode') === REQUEST_OTHER_CODE ? (
                <Form.Item 
                  label={<Text type="secondary" style={{ fontSize: 12 }}>Specify Requests</Text>}
                  name="requestsOther"
                  rules={[{ required: true, message: 'Please specify what needs to be corrected' }]}
                >
                  <TextArea 
                    rows={3} 
                    placeholder="Summarize the corrections or guidance for the applicant..."
                    style={{ fontSize: 13 }} 
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </>
      )}

      <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
        <Tooltip 
          title={canReview && allFieldKeys.length > 0 && !allFieldsReviewed 
            ? `Please review all fields before submitting (${decidedCount} of ${allFieldKeys.length} completed)` 
            : null}
        >
          <Button
            type="primary"
            htmlType="submit"
            loading={reviewing}
            disabled={canReview && allFieldKeys.length > 0 && !allFieldsReviewed}
            block
          >
            Submit Review
          </Button>
        </Tooltip>
      </Form.Item>
    </Form>
  )
}
