import React, { useState, useEffect } from 'react';
import { Card, Typography, message } from 'antd';
import { getRiskProfile } from '../../services/riskProfileService';
import { useBusiness } from '@/hooks/useBusiness';
import RiskFactorsExplanation from './RiskFactorsExplanation';
import RiskImpactCalculator from './RiskImpactCalculator';
import RiskReductionGuidance from './RiskReductionGuidance';

const { Text } = Typography;

const RiskProfileDashboard = () => {
  const { business } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [riskProfile, setRiskProfile] = useState(null);

  useEffect(() => {
    if (business?.id) {
      const fetchRiskProfile = async () => {
        setLoading(true);
        try {
          const profile = await getRiskProfile(business.id);
          setRiskProfile(profile);
        } catch (error) {
          console.error('Failed to fetch risk profile:', error);
          message.error('Failed to load risk profile.');
        } finally {
          setLoading(false);
        }
      };
      fetchRiskProfile();
    }
  }, [business]);

  return (
    <Card loading={loading} title="Risk Profile Dashboard">
      {riskProfile ? (
        <div>
          <div style={{ marginBottom: 24 }}>
            <h3>Risk Factors</h3>
            <RiskFactorsExplanation />
          </div>
          <div style={{ marginBottom: 24 }}>
            <h3>Impact Calculator</h3>
            <RiskImpactCalculator />
          </div>
          <div style={{ marginBottom: 24 }}>
            <h3>Reduction Guidance</h3>
            <RiskReductionGuidance />
          </div>
        </div>
      ) : (
        <Text>No risk profile data available.</Text>
      )}
    </Card>
  );
};

export default RiskProfileDashboard;
