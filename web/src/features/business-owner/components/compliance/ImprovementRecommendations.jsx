import { useState, useEffect } from 'react';
import { Card, List, Button, Alert, Tag, Progress, Space, Typography, message, Collapse, Divider } from 'antd';
import { BulbOutlined, CheckCircleOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { getImprovementRecommendations, implementRecommendation } from '../../services/complianceMonitoringService';
import { useBusiness } from '@/hooks/useBusiness';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const ImprovementRecommendations = () => {
  const { business } = useBusiness();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [implementing, setImplementing] = useState(null);

  useEffect(() => {
    if (business?.id) {
      const fetchRecommendations = async () => {
        setLoading(true);
        try {
          const recommendationsData = await getImprovementRecommendations(business.id);
          setRecommendations(recommendationsData?.recommendations || []);
        } catch (error) {
          message.error('Failed to fetch improvement recommendations.');
        } finally {
          setLoading(false);
        }
      };
      fetchRecommendations();
    }
  }, [business]);

  const handleImplementRecommendation = async (recommendationId) => {
    setImplementing(recommendationId);
    try {
      await implementRecommendation(recommendationId);
      message.success('Recommendation implementation started.');
      // Refresh recommendations
      if (business?.id) {
        const recommendationsData = await getImprovementRecommendations(business.id);
        setRecommendations(recommendationsData?.recommendations || []);
      }
    } catch (error) {
      message.error('Failed to implement recommendation.');
    } finally {
      setImplementing(null);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Critical': 'red',
      'High': 'orange',
      'Medium': 'gold',
      'Low': 'green'
    };
    return colors[priority] || 'default';
  };

  const getImpactColor = (impact) => {
    if (impact >= 80) return '#52c41a';
    if (impact >= 60) return '#faad14';
    return '#f5222d';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Documentation': <CheckCircleOutlined />,
      'Training': <TrophyOutlined />,
      'Process': <ClockCircleOutlined />,
      'System': <BulbOutlined />
    };
    return icons[category] || <BulbOutlined />;
  };

  const groupedRecommendations = recommendations.reduce((groups, rec) => {
    const category = rec.category || 'General';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(rec);
    return groups;
  }, {});

  return (
    <Card loading={loading} title="Improvement Recommendations">
      {recommendations.length === 0 ? (
        <Alert
          message="No Recommendations"
          description="You're doing great! No improvement recommendations at this time."
          type="success"
          showIcon
        />
      ) : (
        <>
          <Alert
            message="Personalized Recommendations Available"
            description={`We have ${recommendations.length} recommendation(s) to help improve your compliance.`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Collapse accordion>
            {Object.entries(groupedRecommendations).map(([category, items]) => (
              <Panel
                key={category}
                header={
                  <Space>
                    {getCategoryIcon(category)}
                    <Text strong>{category}</Text>
                    <Tag color="blue">{items.length} items</Tag>
                  </Space>
                }
              >
                <List
                  itemLayout="vertical"
                  dataSource={items}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        item.status === 'pending' && (
                          <Button
                            type="primary"
                            loading={implementing === item.id}
                            onClick={() => handleImplementRecommendation(item.id)}
                          >
                            Implement
                          </Button>
                        ),
                        item.status === 'in-progress' && (
                          <Button type="default" disabled>
                            In Progress
                          </Button>
                        ),
                        item.status === 'completed' && (
                          <Button type="default" disabled>
                            Completed
                          </Button>
                        )
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<BulbOutlined style={{ fontSize: '24px', color: getPriorityColor(item.priority) }} />}
                        title={
                          <Space>
                            <Text strong>{item.title}</Text>
                            <Tag color={getPriorityColor(item.priority)}>{item.priority}</Tag>
                            <Tag color="blue">{item.estimatedTime}</Tag>
                          </Space>
                        }
                        description={
                          <div>
                            <Text>{item.description}</Text>
                            <div style={{ marginTop: 8 }}>
                              <Text type="secondary">Impact on Compliance Score: </Text>
                              <Text strong style={{ color: getImpactColor(item.impactScore) }}>
                                +{item.impactScore}%
                              </Text>
                            </div>
                            <div style={{ marginTop: 8 }}>
                              <Progress
                                percent={item.progress || 0}
                                size="small"
                                format={() => `${item.progress || 0}% complete`}
                              />
                            </div>
                            {item.implementationSteps && (
                              <div style={{ marginTop: 8 }}>
                                <Title level={5}>Implementation Steps:</Title>
                                <ol>
                                  {item.implementationSteps.map((step, index) => (
                                    <li key={index}>
                                      <Text>{step}</Text>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}
                            {item.requiredResources && (
                              <div style={{ marginTop: 8 }}>
                                <Title level={5}>Required Resources:</Title>
                                <ul>
                                  {item.requiredResources.map((resource, index) => (
                                    <li key={index}>
                                      <Text>{resource}</Text>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Panel>
            ))}
          </Collapse>

          <Divider />

          <Card title="Implementation Summary" size="small">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title="Pending Implementation"
                  value={recommendations.filter(r => r.status === 'pending').length}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="In Progress"
                  value={recommendations.filter(r => r.status === 'in-progress').length}
                  prefix={<BulbOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Completed"
                  value={recommendations.filter(r => r.status === 'completed').length}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </>
      )}
    </Card>
  );
};

export default ImprovementRecommendations;
