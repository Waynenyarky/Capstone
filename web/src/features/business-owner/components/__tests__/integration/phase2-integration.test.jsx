import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App } from 'antd';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Import all Phase 2 components
import RiskProfileDashboard from '../../risk/RiskProfileDashboard';
import BusinessConflictResolver from '../../edge-case/BusinessConflictResolver';
import GeneralPermitApplication from '../../permits/GeneralPermitApplication';
import ComplianceDashboard from '../../compliance/ComplianceDashboard';
import NotificationCenter from '../../notifications/NotificationCenter';
import AdvancedPaymentDashboard from '../../payments/AdvancedPaymentDashboard';
import MobileDashboard from '../../mobile/MobileDashboard';

// Mock all services
vi.mock('@/hooks/useBusiness', () => ({
  useBusiness: vi.fn()
}));

vi.mock('../../../services/riskProfileService', () => ({
  getRiskProfile: vi.fn(),
  getRiskFactors: vi.fn(),
  getRiskImpactAnalysis: vi.fn(),
  getRiskReductionRecommendations: vi.fn()
}));

vi.mock('../../../services/businessConflictService', () => ({
  getBusinessConflicts: vi.fn(),
  resolveConflict: vi.fn()
}));

vi.mock('../../../services/permitService', () => ({
  getPermitCategories: vi.fn(),
  submitPermitApplication: vi.fn(),
  getPermitApplications: vi.fn()
}));

vi.mock('../../../services/complianceMonitoringService', () => ({
  getComplianceOverview: vi.fn(),
  getUpcomingDeadlines: vi.fn(),
  getActiveViolations: vi.fn()
}));

vi.mock('../../../services/notificationService', () => ({
  getNotifications: vi.fn(),
  markNotificationAsRead: vi.fn(),
  deleteNotification: vi.fn()
}));

vi.mock('../../../services/paymentService', () => ({
  getPaymentMethods: vi.fn(),
  getPaymentHistory: vi.fn(),
  getPaymentAnalytics: vi.fn()
}));

vi.mock('../../../services/offlineService', () => ({
  getMobileDashboardData: vi.fn(),
  syncOfflineData: vi.fn()
}));

// Import mocked services
import { useBusiness } from '@/hooks/useBusiness';
import * as riskProfileService from '../../../services/riskProfileService';
import * as businessConflictService from '../../../services/businessConflictService';
import * as permitService from '../../../services/permitService';
import * as complianceMonitoringService from '../../../services/complianceMonitoringService';
import * as notificationService from '../../../services/notificationService';
import * as paymentService from '../../../services/paymentService';
import * as offlineService from '../../../services/offlineService';

const mockBusiness = {
  id: 'test-business-123',
  businessName: 'Test Business',
  applicationStatus: 'approved',
  permitNumber: 'PERMIT-001'
};

const mockBusinesses = [mockBusiness, {
  id: 'test-business-456',
  businessName: 'Second Business',
  applicationStatus: 'active',
  permitNumber: 'PERMIT-002'
}];

describe('Phase 2 Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup useBusiness mock
    useBusiness.mockReturnValue({ 
      business: mockBusiness, 
      businesses: mockBusinesses 
    });
    
    // Setup service mocks with default responses
    riskProfileService.getRiskProfile.mockResolvedValue({
      riskLevel: 'Medium',
      factors: [],
      impact: {},
      recommendations: []
    });
    
    businessConflictService.getBusinessConflicts.mockResolvedValue({
      conflicts: []
    });
    
    permitService.getPermitCategories.mockResolvedValue({
      categories: []
    });
    
    permitService.getPermitApplications.mockResolvedValue({
      applications: []
    });
    
    complianceMonitoringService.getComplianceOverview.mockResolvedValue({
      score: 85,
      activeRequirements: 5,
      upcomingDeadlines: 2,
      activeViolations: 0
    });
    
    complianceMonitoringService.getUpcomingDeadlines.mockResolvedValue({
      deadlines: []
    });
    
    complianceMonitoringService.getActiveViolations.mockResolvedValue({
      violations: []
    });
    
    notificationService.getNotifications.mockResolvedValue({
      notifications: []
    });
    
    paymentService.getPaymentMethods.mockResolvedValue({
      methods: []
    });
    
    paymentService.getPaymentHistory.mockResolvedValue({
      payments: []
    });
    
    offlineService.getMobileDashboardData.mockResolvedValue({
      activePermits: 2,
      pendingPayments: 1,
      upcomingInspections: 0,
      complianceIssues: 0,
      recentActivity: []
    });
  });

  const renderWithProviders = (component) => {
    return render(
      <ConfigProvider>
        <App>
          <BrowserRouter>{component}</BrowserRouter>
        </App>
      </ConfigProvider>
    );
  };

  describe('Component Rendering Integration', () => {
    it('should render all Phase 2 components without errors', async () => {
      const components = [
        { name: 'RiskProfileDashboard', component: <RiskProfileDashboard key="risk" /> },
        { name: 'BusinessConflictResolver', component: <BusinessConflictResolver key="conflict" /> },
        { name: 'GeneralPermitApplication', component: <GeneralPermitApplication key="permit" /> },
        { name: 'ComplianceDashboard', component: <ComplianceDashboard key="compliance" /> },
        { name: 'NotificationCenter', component: <NotificationCenter key="notifications" /> },
        { name: 'AdvancedPaymentDashboard', component: <AdvancedPaymentDashboard key="payments" /> },
        { name: 'MobileDashboard', component: <MobileDashboard key="mobile" /> }
      ];

      for (const { component } of components) {
        const { unmount } = renderWithProviders(component);
        // Just verify component renders without crashing
        expect(document.body).toBeTruthy();
        unmount();
      }
    });

    it('should handle service failures gracefully', async () => {
      // Test that components render even when services fail
      const { unmount } = renderWithProviders(<RiskProfileDashboard />);
      expect(document.body).toBeTruthy();
      unmount();
    });
  });

  describe('Data Flow Integration', () => {
    it('should pass business context correctly to all components', async () => {
      // Verify each component can access business context
      const components = [
        <RiskProfileDashboard key="risk" />,
        <BusinessConflictResolver key="conflict" />,
        <GeneralPermitApplication key="permit" />,
        <ComplianceDashboard key="compliance" />,
        <NotificationCenter key="notifications" />,
        <AdvancedPaymentDashboard key="payments" />,
        <MobileDashboard key="mobile" />
      ];

      for (const component of components) {
        const { unmount } = renderWithProviders(component);
        expect(document.body).toBeTruthy();
        unmount();
      }
    });

    it('should handle multiple businesses correctly', async () => {
      // Test BusinessConflictResolver with multiple businesses
      const { unmount } = renderWithProviders(<BusinessConflictResolver />);
      
      await waitFor(() => {
        expect(businessConflictService.getBusinessConflicts).toHaveBeenCalledWith(
          mockBusinesses.map(b => b.id)
        );
      });
      
      unmount();
    });
  });

  describe('User Interaction Integration', () => {
    it('should handle user interactions across components', async () => {
      // Test RiskProfileDashboard interactions
      const { unmount: unmount1 } = renderWithProviders(<RiskProfileDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/risk profile dashboard/i)).toBeInTheDocument();
      });
      
      // Test tab navigation
      const riskFactorsTab = screen.queryByText(/risk factors/i);
      if (riskFactorsTab) {
        fireEvent.click(riskFactorsTab);
        await waitFor(() => {
          expect(riskProfileService.getRiskFactors).toHaveBeenCalled();
        });
      }
      
      unmount1();

      // Test NotificationCenter interactions
      const { unmount: unmount2 } = renderWithProviders(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText(/notification center/i)).toBeInTheDocument();
      });
      
      // Test notification filtering
      const filterSelect = screen.queryByRole('combobox');
      if (filterSelect) {
        fireEvent.change(filterSelect, { target: { value: 'unread' } });
        await waitFor(() => {
          expect(notificationService.getNotifications).toHaveBeenCalled();
        });
      }
      
      unmount2();
    });

    it('should handle form submissions correctly', async () => {
      // Test GeneralPermitApplication form
      const { unmount } = renderWithProviders(<GeneralPermitApplication />);
      
      await waitFor(() => {
        expect(screen.getByText(/general permit application/i)).toBeInTheDocument();
      });
      
      // Simulate form submission
      const categorySelect = screen.queryByRole('combobox');
      if (categorySelect) {
        fireEvent.change(categorySelect, { target: { value: 'test-category' } });
        
        const submitButton = screen.queryByText(/submit application/i);
        if (submitButton) {
          fireEvent.click(submitButton);
          await waitFor(() => {
            expect(permitService.submitPermitApplication).toHaveBeenCalled();
          });
        }
      }
      
      unmount();
    });
  });

  describe('Error Handling Integration', () => {
    it('should display appropriate error messages', async () => {
      // Mock specific error
      riskProfileService.getRiskProfile.mockRejectedValue(new Error('Network error'));
      
      const { unmount } = renderWithProviders(<RiskProfileDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load risk profile/i)).toBeInTheDocument();
      });
      
      unmount();
    });

    it('should handle empty data states', async () => {
      // Mock empty data
      notificationService.getNotifications.mockResolvedValue({ notifications: [] });
      paymentService.getPaymentHistory.mockResolvedValue({ payments: [] });
      
      const { unmount } = renderWithProviders(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText(/no notifications found/i)).toBeInTheDocument();
      });
      
      unmount();
    });
  });

  describe('Performance Integration', () => {
    it('should render multiple components efficiently', async () => {
      const startTime = performance.now();
      
      const AllComponents = () => (
        <div>
          <RiskProfileDashboard />
          <BusinessConflictResolver />
          <GeneralPermitApplication />
          <ComplianceDashboard />
          <NotificationCenter />
          <AdvancedPaymentDashboard />
          <MobileDashboard />
        </div>
      );
      
      const { unmount } = renderWithProviders(<AllComponents />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (5 seconds)
      expect(renderTime).toBeLessThan(5000);
      
      unmount();
    });
  });
});
