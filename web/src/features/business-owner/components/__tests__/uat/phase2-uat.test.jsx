import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App } from 'antd';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// Import Phase 2 components for UAT
import RiskProfileDashboard from '../../risk/RiskProfileDashboard';
import BusinessConflictResolver from '../../edge-case/BusinessConflictResolver';
import GeneralPermitApplication from '../../permits/GeneralPermitApplication';
import ComplianceDashboard from '../../compliance/ComplianceDashboard';
import NotificationCenter from '../../notifications/NotificationCenter';
import AdvancedPaymentDashboard from '../../payments/AdvancedPaymentDashboard';
import MobileDashboard from '../../mobile/MobileDashboard';

// Mock services for UAT
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

vi.mock('@/hooks/useBusiness', () => ({
  useBusiness: vi.fn()
}));

import * as riskProfileService from '../../../services/riskProfileService';
import * as businessConflictService from '../../../services/businessConflictService';
import * as permitService from '../../../services/permitService';
import * as complianceMonitoringService from '../../../services/complianceMonitoringService';
import * as notificationService from '../../../services/notificationService';
import * as paymentService from '../../../services/paymentService';
import * as offlineService from '../../../services/offlineService';
import { useBusiness } from '@/hooks/useBusiness';

describe('Phase 2 User Acceptance Tests', () => {
  const mockBusiness = {
    id: 'test-business-123',
    businessName: 'Test Restaurant LLC',
    applicationStatus: 'approved',
    permitNumber: 'PERMIT-001',
    businessType: 'restaurant',
    address: '123 Main St, Test City, TC 12345'
  };

  const mockBusinesses = [mockBusiness, {
    id: 'test-business-456',
    businessName: 'Test Cafe LLC',
    applicationStatus: 'active',
    permitNumber: 'PERMIT-002'
  }];

  // Mock realistic data for UAT
  const mockRiskProfile = {
    riskLevel: 'Medium',
    score: 65,
    factors: [
      { name: 'Food Safety', level: 'High', impact: 25 },
      { name: 'Fire Safety', level: 'Medium', impact: 15 },
      { name: 'Building Compliance', level: 'Low', impact: 10 }
    ],
    recommendations: [
      { title: 'Update fire extinguishers', priority: 'High', estimatedTime: '1 week' },
      { title: 'Staff training renewal', priority: 'Medium', estimatedTime: '2 weeks' }
    ]
  };

  const mockNotifications = [
    {
      id: 'notif-1',
      title: 'Permit Renewal Due',
      message: 'Your business permit expires in 30 days',
      type: 'Permit',
      priority: 'High',
      read: false,
      receivedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'notif-2',
      title: 'Payment Confirmation',
      message: 'Your recent payment of $250.00 was processed',
      type: 'Payment',
      priority: 'Low',
      read: true,
      receivedAt: '2024-01-14T14:30:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useBusiness.mockReturnValue({ business: mockBusiness, businesses: mockBusinesses });
    
    // Setup default service responses
    riskProfileService.getRiskProfile.mockResolvedValue(mockRiskProfile);
    businessConflictService.getBusinessConflicts.mockResolvedValue({ conflicts: [] });
    permitService.getPermitCategories.mockResolvedValue({
      categories: [
        { id: 'food-permit', name: 'Food Service Permit', description: 'Required for food service businesses' },
        { id: 'health-permit', name: 'Health Permit', description: 'Health and safety permit' }
      ]
    });
    complianceMonitoringService.getComplianceOverview.mockResolvedValue({
      score: 85,
      activeRequirements: 5,
      upcomingDeadlines: 2,
      activeViolations: 0
    });
    notificationService.getNotifications.mockResolvedValue({ notifications: mockNotifications });
    paymentService.getPaymentMethods.mockResolvedValue({
      methods: [
        { id: 'card-1', type: 'credit-card', name: 'Business Credit Card', isDefault: true },
        { id: 'bank-1', type: 'bank', name: 'Business Checking Account' }
      ]
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

  describe('User Workflow Tests', () => {
    it('should complete risk assessment workflow', async () => {
      const user = userEvent.setup();
      
      const { unmount } = renderWithProviders(<RiskProfileDashboard />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText(/risk profile dashboard/i)).toBeInTheDocument();
      });

      // User should see their risk level prominently
      expect(screen.getByText(/medium risk/i)).toBeInTheDocument();
      expect(screen.getByText('65')).toBeInTheDocument(); // Risk score

      // User should be able to navigate between tabs
      const riskFactorsTab = screen.getByText(/risk factors/i);
      await user.click(riskFactorsTab);
      
      // Should see risk factors with clear visual indicators
      expect(screen.getByText(/food safety/i)).toBeInTheDocument();
      expect(screen.getByText(/high/i)).toBeInTheDocument();

      // User should be able to view recommendations
      const recommendationsTab = screen.getByText(/risk reduction/i);
      await user.click(recommendationsTab);
      
      // Should see actionable recommendations
      expect(screen.getByText(/update fire extinguishers/i)).toBeInTheDocument();
      expect(screen.getByText(/high priority/i)).toBeInTheDocument();

      unmount();
    });

    it('should complete permit application workflow', async () => {
      const user = userEvent.setup();
      
      const { unmount } = renderWithProviders(<GeneralPermitApplication />);
      
      await waitFor(() => {
        expect(screen.getByText(/general permit application/i)).toBeInTheDocument();
      });

      // User should see available permit categories
      expect(screen.getByText(/food service permit/i)).toBeInTheDocument();
      expect(screen.getByText(/health permit/i)).toBeInTheDocument();

      // User should be able to start application
      const categorySelect = screen.getByRole('combobox');
      await user.selectOptions(categorySelect, 'food-permit');
      
      const nextButton = screen.getByText(/next/i);
      await user.click(nextButton);

      // User should be able to fill application form
      expect(screen.getByText(/application details/i)).toBeInTheDocument();
      
      // User should be able to submit application
      const submitButton = screen.getByText(/submit application/i);
      expect(submitButton).toBeInTheDocument();

      unmount();
    });

    it('should complete compliance monitoring workflow', async () => {
      const user = userEvent.setup();
      
      const { unmount } = renderWithProviders(<ComplianceDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/compliance dashboard/i)).toBeInTheDocument();
      });

      // User should see their compliance score prominently
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText(/active requirements/i)).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();

      // User should be able to view ongoing requirements
      const requirementsTab = screen.getByText(/ongoing requirements/i);
      await user.click(requirementsTab);
      
      // Should see requirement tracking interface
      expect(screen.getByText(/track recurring requirements/i)).toBeInTheDocument();

      // User should be able to view improvement recommendations
      const recommendationsTab = screen.getByText(/improvement recommendations/i);
      await user.click(recommendationsTab);
      
      // Should see actionable recommendations
      expect(screen.getByText(/improvement recommendations/i)).toBeInTheDocument();

      unmount();
    });

    it('should complete notification management workflow', async () => {
      const user = userEvent.setup();
      
      const { unmount } = renderWithProviders(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText(/notification center/i)).toBeInTheDocument();
      });

      // User should see unread notification count
      expect(screen.getByText('1')).toBeInTheDocument(); // Unread count

      // User should be able to filter notifications
      const filterSelect = screen.getByRole('combobox');
      await user.selectOptions(filterSelect, 'unread');
      
      // Should see only unread notifications
      expect(screen.getByText(/permit renewal due/i)).toBeInTheDocument();
      expect(screen.queryByText(/payment confirmation/i)).not.toBeInTheDocument();

      // User should be able to mark notification as read
      const markReadButton = screen.getByText(/mark read/i);
      await user.click(markReadButton);
      
      // Should update notification status
      expect(notificationService.markNotificationAsRead).toHaveBeenCalled();

      unmount();
    });

    it('should complete payment management workflow', async () => {
      const user = userEvent.setup();
      
      const { unmount } = renderWithProviders(<AdvancedPaymentDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/advanced payment dashboard/i)).toBeInTheDocument();
      });

      // User should see payment statistics
      expect(screen.getByText(/total payments/i)).toBeInTheDocument();
      expect(screen.getByText(/completed/i)).toBeInTheDocument();

      // User should be able to view payment methods
      expect(screen.getByText(/business credit card/i)).toBeInTheDocument();
      expect(screen.getByText(/default/i)).toBeInTheDocument();

      // User should be able to setup recurring payment
      const setupRecurringButton = screen.getByText(/setup recurring payment/i);
      await user.click(setupRecurringButton);
      
      // Should see recurring payment modal
      expect(screen.getByText(/setup recurring payment/i)).toBeInTheDocument();

      unmount();
    });
  });

  describe('Accessibility Tests', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      const { unmount } = renderWithProviders(<ComplianceDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/compliance dashboard/i)).toBeInTheDocument();
      });

      // User should be able to navigate using Tab key
      await user.tab();
      // Should focus on first interactive element
      
      // User should be able to navigate between tabs
      const requirementsTab = screen.getByText(/ongoing requirements/i);
      requirementsTab.focus();
      await user.keyboard('{Enter}');
      
      // Should navigate to requirements tab
      expect(screen.getByText(/track recurring requirements/i)).toBeInTheDocument();

      unmount();
    });

    it('should have proper ARIA labels and roles', async () => {
      const { unmount } = renderWithProviders(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText(/notification center/i)).toBeInTheDocument();
      });

      // Should have proper heading structure
      expect(screen.getByRole('heading', { name: /notification center/i })).toBeInTheDocument();

      // Should have proper form controls
      const searchInput = screen.getByRole('textbox');
      expect(searchInput).toHaveAttribute('placeholder');

      // Should have proper button labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });

      unmount();
    });

    it('should support screen readers', async () => {
      const { unmount } = renderWithProviders(<RiskProfileDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/risk profile dashboard/i)).toBeInTheDocument();
      });

      // Should have descriptive titles
      expect(screen.getByRole('heading', { name: /risk profile dashboard/i })).toBeInTheDocument();

      // Should have proper semantic structure
      expect(screen.getByRole('main')).toBeInTheDocument();

      // Should have descriptive text for visual elements
      expect(screen.getByText(/medium risk/i)).toBeInTheDocument();
      expect(screen.getByText('65')).toBeInTheDocument();

      unmount();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle service failures gracefully', async () => {
      // Mock service failure
      riskProfileService.getRiskProfile.mockRejectedValue(new Error('Service unavailable'));
      
      const { unmount } = renderWithProviders(<RiskProfileDashboard />);
      
      await waitFor(() => {
        // Should show error message
        expect(screen.getByText(/failed to load risk profile/i)).toBeInTheDocument();
      });

      // Should provide recovery options
      expect(screen.getByText(/retry/i)).toBeInTheDocument();

      unmount();
    });

    it('should handle empty data states', async () => {
      // Mock empty data
      notificationService.getNotifications.mockResolvedValue({ notifications: [] });
      
      const { unmount } = renderWithProviders(<NotificationCenter />);
      
      await waitFor(() => {
        // Should show empty state message
        expect(screen.getByText(/no notifications found/i)).toBeInTheDocument();
      });

      // Should provide clear guidance
      expect(screen.getByText(/you have no notifications at this time/i)).toBeInTheDocument();

      unmount();
    });

    it('should handle network issues', async () => {
      // Mock network timeout
      permitService.getPermitCategories.mockImplementation(() => 
        new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), 100))
      );
      
      const { unmount } = renderWithProviders(<GeneralPermitApplication />);
      
      await waitFor(() => {
        // Should show loading state initially
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
      });

      // Should show error after timeout
      await waitFor(() => {
        expect(screen.getByText(/failed to load permit categories/i)).toBeInTheDocument();
      }, { timeout: 200 });

      unmount();
    });
  });

  describe('Mobile Experience Tests', () => {
    it('should be responsive on mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      const { unmount } = renderWithProviders(<MobileDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/test restaurant llc/i)).toBeInTheDocument();
      });

      // Should have mobile-optimized navigation
      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();

      // Should have touch-friendly buttons
      const quickActions = screen.getAllByRole('button');
      quickActions.forEach(button => {
        const rect = button.getBoundingClientRect();
        // Should have adequate touch targets (44px minimum)
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
      });

      unmount();
    });

    it('should support offline functionality', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      const { unmount } = renderWithProviders(<MobileDashboard />);
      
      await waitFor(() => {
        // Should show offline indicator
        expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
      });

      // Should provide offline functionality
      expect(screen.getByText(/some features may be limited/i)).toBeInTheDocument();

      unmount();
    });
  });

  describe('Performance and Usability Tests', () => {
    it('should load within acceptable time limits', async () => {
      const startTime = performance.now();
      
      const { unmount } = renderWithProviders(<ComplianceDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/compliance dashboard/i)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);

      unmount();
    });

    it('should respond quickly to user interactions', async () => {
      const user = userEvent.setup();
      
      const { unmount } = renderWithProviders(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText(/notification center/i)).toBeInTheDocument();
      });

      const startTime = performance.now();
      
      // Test search interaction
      const searchInput = screen.getByRole('textbox');
      await user.type(searchInput, 'test');
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Should respond within 100ms
      expect(responseTime).toBeLessThan(100);

      unmount();
    });

    it('should provide clear feedback for user actions', async () => {
      const user = userEvent.setup();
      
      const { unmount } = renderWithProviders(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText(/notification center/i)).toBeInTheDocument();
      });

      // Test action feedback
      const markReadButton = screen.getByText(/mark read/i);
      await user.click(markReadButton);

      // Should show loading or success feedback
      await waitFor(() => {
        expect(screen.getByText(/notification marked as read/i)).toBeInTheDocument();
      }, { timeout: 1000 });

      unmount();
    });
  });

  describe('Data Validation and Integrity Tests', () => {
    it('should validate user input correctly', async () => {
      const user = userEvent.setup();
      
      const { unmount } = renderWithProviders(<GeneralPermitApplication />);
      
      await waitFor(() => {
        expect(screen.getByText(/general permit application/i)).toBeInTheDocument();
      });

      // Test form validation
      const categorySelect = screen.getByRole('combobox');
      await user.selectOptions(categorySelect, 'food-permit');
      
      const nextButton = screen.getByText(/next/i);
      await user.click(nextButton);

      // Should validate required fields
      const submitButton = screen.getByText(/submit application/i);
      await user.click(submitButton);

      // Should show validation errors for empty fields
      await waitFor(() => {
        expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument();
      });

      unmount();
    });

    it('should handle data consistency', async () => {
      const user = userEvent.setup();
      
      const { unmount } = renderWithProviders(<ComplianceDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/compliance dashboard/i)).toBeInTheDocument();
      });

      // Data should be consistent across tabs
      const score = screen.getByText('85');
      expect(score).toBeInTheDocument();

      const requirementsTab = screen.getByText(/ongoing requirements/i);
      await user.click(requirementsTab);

      // Should maintain data consistency
      expect(screen.getByText('85')).toBeInTheDocument();

      unmount();
    });
  });
});
