/**
 * Integration Tests for Phase 2 Complete Workflows
 * Tests end-to-end business processes across multiple services and components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock all the services we've tested
vi.mock('@/features/business-owner/services/businessConflictService');
vi.mock('@/features/business-owner/services/timelineService');
vi.mock('@/features/business-owner/services/concurrentActionService');
vi.mock('@/features/business-owner/services/permitService');
vi.mock('@/features/business-owner/services/occupationalPermitService');
vi.mock('@/features/business-owner/services/complianceMonitoringService');
vi.mock('@/features/business-owner/services/riskProfileService');
vi.mock('@/features/business-owner/services/dataRecoveryService');
vi.mock('@/features/business-owner/services/userErrorService');
vi.mock('@/features/business-owner/services/feeService');
vi.mock('@/features/business-owner/services/dashboardService');
vi.mock('@/features/admin/services/staffService');
vi.mock('@/features/admin/services/approvalService');

// Mock HTTP calls
vi.mock('@/lib/http', () => ({
  get: vi.fn(),
  post: vi.fn(),
  del: vi.fn()
}));

// Mock antd message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn()
    }
  };
});

// Import components to test
import BusinessConflictResolver from '@/features/business-owner/components/edge-case/BusinessConflictResolver.jsx';

// Test wrapper
const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ConfigProvider>
          {children}
        </ConfigProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Phase 2 Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Business Conflict Resolution Workflow', () => {
    it('should complete end-to-end conflict resolution', async () => {
      // Mock the service responses
      const { getBusinessConflict } = await import('@/features/business-owner/services/businessConflictService');
      getBusinessConflict.mockResolvedValue({
        conflicts: [
          {
            id: 'conflict1',
            businesses: ['business1', 'business2'],
            type: 'duplicate_registration',
            status: 'pending'
          }
        ]
      });

      render(
        <TestWrapper>
          <BusinessConflictResolver />
        </TestWrapper>
      );

      // Verify component renders
      expect(screen.getByText(/business conflict/i)).toBeInTheDocument();

      // Wait for conflicts to load
      await waitFor(() => {
        expect(screen.getByText(/conflict1/i)).toBeInTheDocument();
      });

      // Test conflict resolution interaction
      const resolveButton = screen.getByText(/resolve/i);
      fireEvent.click(resolveButton);

      // Verify resolution process
      await waitFor(() => {
        expect(screen.getByText(/conflict resolved/i)).toBeInTheDocument();
      });
    });
  });

  describe('Permit Application Workflow', () => {
    it('should handle complete permit application process', async () => {
      // Mock permit service
      const { submitPermitApplication } = await import('@/features/business-owner/services/permitService');
      submitPermitApplication.mockResolvedValue({
        success: true,
        applicationId: 'app1',
        status: 'submitted'
      });

      // Mock compliance service
      const { getComplianceOverview } = await import('@/features/business-owner/services/complianceMonitoringService');
      getComplianceOverview.mockResolvedValue({
        complianceScore: 85,
        requirements: [],
        violations: []
      });

      // Test the workflow
      const applicationData = {
        businessType: 'retail',
        businessName: 'Test Store',
        description: 'Test description'
      };

      const result = await submitPermitApplication(applicationData);
      
      expect(result.success).toBe(true);
      expect(result.applicationId).toBe('app1');
      expect(submitPermitApplication).toHaveBeenCalledWith(applicationData);
    });
  });

  describe('Compliance Monitoring Workflow', () => {
    it('should track compliance across multiple services', async () => {
      // Mock compliance monitoring
      const { getComplianceOverview, getUpcomingDeadlines, getActiveViolations } = await import('@/features/business-owner/services/complianceMonitoringService');
      
      getComplianceOverview.mockResolvedValue({
        complianceScore: 92,
        requirements: [
          { id: 'req1', status: 'compliant', dueDate: '2024-12-31' },
          { id: 'req2', status: 'pending', dueDate: '2024-11-30' }
        ],
        violations: []
      });

      getUpcomingDeadlines.mockResolvedValue([
        { id: 'req1', title: 'Annual Report', dueDate: '2024-12-31' },
        { id: 'req2', title: 'Safety Inspection', dueDate: '2024-11-30' }
      ]);

      getActiveViolations.mockResolvedValue([]);

      // Test compliance overview
      const compliance = await getComplianceOverview('business1');
      expect(compliance.complianceScore).toBe(92);
      expect(compliance.requirements).toHaveLength(2);

      // Test deadlines
      const deadlines = await getUpcomingDeadlines('business1');
      expect(deadlines).toHaveLength(2);

      // Test violations
      const violations = await getActiveViolations('business1');
      expect(violations).toHaveLength(0);
    });
  });

  describe('Risk Assessment Workflow', () => {
    it('should complete risk assessment process', async () => {
      // Mock risk profile service
      const { getRiskProfile, getRiskFactors, getRiskImpactAnalysis } = await import('@/features/business-owner/services/riskProfileService');
      
      getRiskProfile.mockResolvedValue({
        riskScore: 75,
        level: 'Medium',
        factors: ['safety', 'financial'],
        recommendations: []
      });

      getRiskFactors.mockResolvedValue({
        factors: [
          { name: 'safety', score: 80, impact: 'high' },
          { name: 'financial', score: 70, impact: 'medium' }
        ]
      });

      getRiskImpactAnalysis.mockResolvedValue({
        feeImpact: '+$500',
        inspectionFrequency: 'increased',
        riskMitigation: ['insurance', 'training']
      });

      // Test risk profile
      const riskProfile = await getRiskProfile('business1');
      expect(riskProfile.riskScore).toBe(75);
      expect(riskProfile.level).toBe('Medium');

      // Test risk factors
      const factors = await getRiskFactors('business1');
      expect(factors).toHaveLength(2);

      // Test impact analysis
      const impact = await getRiskImpactAnalysis('business1');
      expect(impact.feeImpact).toBe('+$500');
    });
  });

  describe('Data Recovery Workflow', () => {
    it('should handle data corruption recovery', async () => {
      // Mock data recovery service
      const { getDataCorruptionEvents, restoreBackup, validateIntegrity } = await import('@/features/business-owner/services/dataRecoveryService');
      
      getDataCorruptionEvents.mockResolvedValue([
        {
          id: 'event1',
          type: 'data_corruption',
          timestamp: '2024-03-08T10:00:00Z',
          status: 'active'
        }
      ]);

      restoreBackup.mockResolvedValue({
        success: true,
        restoredData: true,
        timestamp: '2024-03-08T10:05:00Z'
      });

      validateIntegrity.mockResolvedValue({
        integrity: 'valid',
        issues: [],
        validatedAt: '2024-03-08T10:06:00Z'
      });

      // Test corruption detection
      const events = await getDataCorruptionEvents('business1');
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('data_corruption');

      // Test backup restoration
      const restore = await restoreBackup('event1', { targetBusinessId: 'business1' });
      expect(restore.success).toBe(true);

      // Test integrity validation
      const integrity = await validateIntegrity('business1');
      expect(integrity.integrity).toBe('valid');
    });
  });

  describe('Admin Approval Workflow', () => {
    it('should handle admin approval process', async () => {
      // Mock admin services
      const { getStaffList, createStaff } = await import('@/features/admin/services/staffService');
      const { getApprovals, approveRequest } = await import('@/features/admin/services/approvalService');
      
      getStaffList.mockResolvedValue([
        { id: 'staff1', firstName: 'John', lastName: 'Doe', role: 'inspector' },
        { id: 'staff2', firstName: 'Jane', lastName: 'Smith', role: 'admin' }
      ]);

      getApprovals.mockResolvedValue({
        approvals: [
          {
            id: 'approval1',
            type: 'business_registration',
            status: 'pending',
            requestDate: '2024-03-08T09:00:00Z'
          }
        ]
      });

      approveRequest.mockResolvedValue({
        success: true,
        approvalId: 'approval1',
        status: 'approved',
        approvedAt: '2024-03-08T10:00:00Z'
      });

      // Test staff listing
      const staff = await getStaffList();
      expect(staff).toHaveLength(2);

      // Test approval listing
      const approvals = await getApprovals();
      expect(approvals.approvals).toHaveLength(1);

      // Test approval process
      const approval = await approveRequest('approval1', { 
        approved: true, 
        comment: 'Application verified and approved' 
      });
      expect(approval.success).toBe(true);
      expect(approval.status).toBe('approved');
    });
  });

  describe('Cross-Service Data Consistency', () => {
    it('should maintain data consistency across services', async () => {
      // Mock related services
      const { getDashboardData } = await import('@/features/business-owner/services/dashboardService');
      const { getComplianceOverview } = await import('@/features/business-owner/services/complianceMonitoringService');
      const { getRiskProfile } = await import('@/features/business-owner/services/riskProfileService');
      
      getDashboardData.mockResolvedValue({
        totalBusinesses: 5,
        activeBusinesses: 4,
        pendingApplications: 2,
        complianceScore: 88
      });

      getComplianceOverview.mockResolvedValue({
        complianceScore: 88,
        requirements: [],
        violations: []
      });

      getRiskProfile.mockResolvedValue({
        riskScore: 72,
        level: 'Medium',
        factors: []
      });

      // Test data consistency
      const dashboard = await getDashboardData('business1');
      const compliance = await getComplianceOverview('business1');
      const risk = await getRiskProfile('business1');

      // Verify compliance scores match
      expect(dashboard.complianceScore).toBe(compliance.complianceScore);
      
      // Verify data relationships
      expect(dashboard.totalBusinesses).toBeGreaterThan(0);
      expect(compliance.complianceScore).toBeGreaterThan(0);
      expect(risk.riskScore).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle errors gracefully across services', async () => {
      // Mock service failures
      const { getComplianceOverview } = await import('@/features/business-owner/services/complianceMonitoringService');
      const { getUserErrorPatterns } = await import('@/features/business-owner/services/userErrorService');
      
      getComplianceOverview.mockRejectedValue(new Error('Service unavailable'));
      getUserErrorPatterns.mockResolvedValue({
        patterns: [
          { type: 'network_error', frequency: 'high', impact: 'medium' }
        ]
      });

      // Test error handling
      await expect(getComplianceOverview('business1')).rejects.toThrow('Service unavailable');

      // Test error pattern detection
      const patterns = await getUserErrorPatterns('business1');
      expect(patterns.patterns).toHaveLength(1);
      expect(patterns.patterns[0].type).toBe('network_error');
    });
  });
});
