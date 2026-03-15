import React, { useState, useEffect } from 'react';
import { Card, Typography, message, List, Checkbox } from 'antd';
import { getRiskReductionRecommendations } from '../../services/riskProfileService';
import { useBusiness } from '@/hooks/useBusiness';

const { Title, Text } = Typography;
const { Item } = List;

const RiskReductionGuidance = () => {
  const { business } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (business?.id) {
      const fetchRecommendations = async () => {
        setLoading(true);
        try {
          const recs = await getRiskReductionRecommendations(business.id);
          setRecommendations(recs?.recommendations || []);
        } catch (error) {
          message.error('Failed to load risk reduction recommendations.');
        } finally {
          setLoading(false);
        }
      };
      fetchRecommendations();
    }
  }, [business]);

  return (
    <Card loading={loading} title="Risk Reduction Guidance">
      <div>
        {recommendations.map(item => (
          <div key={item.id} style={{ marginBottom: 16 }}>
            <Text strong>{item.title}</Text>
            <br />
            <Text>{item.description}</Text>
            <br />
            <Checkbox onChange={() => { /* Handle completion */ }} />
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RiskReductionGuidance;
