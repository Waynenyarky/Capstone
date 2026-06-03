import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Alert, List, Tag, Button, Space, Typography, message } from 'antd';
import { TrophyOutlined, ExclamationCircleOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getComplianceOverview, getUpcomingDeadlines, getActiveViolations } from '../../services/complianceMonitoringService';
import { useBusiness } from '@/hooks/useBusiness';

const { Title, Text } = Typography;

const ComplianceDashboard = () => {
  const { business } = useBusiness();
  const [overview, setOverview] = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (business?.id) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [overviewData, deadlinesData, violationsData] = await Promise.all([
            getComplianceOverview(business.id),
            getUpcomingDeadlines(business.id),
            getActiveViolations(business.id)
          ]);
          setOverview(overviewData);
          setDeadlines(deadlinesData?.deadlines || []);
          setViolations(violationsData?.violations || []);
        } catch (error) {
          message.error('Failed to fetch compliance data.');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [business]);

  const getScoreColor = (score) => {
    if (score >= 90) return '#52c41a';
    if (score >= 70) return '#faad14';
    return '#f5222d';
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      'Critical': 'red',
      'High': 'orange',
      'Medium': 'gold',
      'Low': 'green'
    };
    return colors[urgency] || 'default';
  };

  return (
    <Card loading={loading} title="Compliance Dashboard">
      {overview && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Compliance Score"
                value={overview.score}
                suffix="/100"
                valueStyle={{ color: getScoreColor(overview.score) }}
                prefix={<TrophyOutlined />}
              />
              <Progress
                percent={overview.score}
                strokeColor={getScoreColor(overview.score)}
                showInfo={false}
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Active Requirements"
                value={overview.activeRequirements}
                valueStyle={{ color: '#1890ff' }}
                prefix={<CheckCircleOutlined />}
              />
              <Text type="secondary">{overview.completedThisMonth} completed this month</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Upcoming Deadlines"
                value={overview.upcomingDeadlines}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
              <Text type="secondary">{overview.overdueCount} overdue</Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Active Violations"
                value={overview.activeViolations}
                valueStyle={{ color: '#f5222d' }}
                prefix={<ExclamationCircleOutlined />}
              />
              <Text type="secondary">{overview.resolvedThisMonth} resolved this month</Text>
            </Card>
          </Col>
        </Row>
      )}

      {violations.length > 0 && (
        <Alert
          message="Active Violations Require Attention"
          description={`You have ${violations.length} active violation(s) that need to be addressed.`}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Upcoming Deadlines" size="small">
            <List
              size="small"
              dataSource={deadlines.slice(0, 5)}
              renderItem={deadline => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{deadline.requirement}</Text>
                        <Tag color={getUrgencyColor(deadline.urgency)}>{deadline.urgency}</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Text type="secondary">Due: {deadline.dueDate}</Text>
                        <br />
                        <Text type="secondary">{deadline.daysRemaining} days remaining</Text>
                      </div>
                    }
                  />
                  <Button type="primary" size="small">Complete</Button>
                </List.Item>
              )}
            />
            {deadlines.length > 5 && (
              <Button type="link" block>View All Deadlines</Button>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Recent Violations" size="small">
            <List
              size="small"
              dataSource={violations.slice(0, 5)}
              renderItem={violation => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{violation.type}</Text>
                        <Tag color="red">{violation.severity}</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Text type="secondary">Issued: {violation.issueDate}</Text>
                        <br />
                        <Text type="secondary">Fine: ${violation.fine}</Text>
                      </div>
                    }
                  />
                  <Button type="primary" size="small">Resolve</Button>
                </List.Item>
              )}
            />
            {violations.length > 5 && (
              <Button type="link" block>View All Violations</Button>
            )}
          </Card>
        </Col>
      </Row>

      {overview && (
        <Card title="Compliance Trend" style={{ marginTop: 16 }}>
          <Progress
            percent={overview.trendImprovement}
            status={overview.trendImprovement > 0 ? 'success' : 'exception'}
            format={() => `${overview.trendImprovement > 0 ? '+' : ''}${overview.trendImprovement}% vs last month`}
          />
          <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
            Compliance score has {overview.trendImprovement > 0 ? 'improved' : 'declined'} compared to last month
          </Text>
        </Card>
      )}
    </Card>
  );
};

export default ComplianceDashboard;
