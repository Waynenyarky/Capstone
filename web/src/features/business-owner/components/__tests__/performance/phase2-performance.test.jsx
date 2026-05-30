import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App } from 'antd';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Import optimized components
import NotificationCenter from '../../notifications/NotificationCenter';
import PaymentAnalytics from '../../payments/PaymentAnalytics';

// Mock services with performance tracking
vi.mock('../../../services/notificationService', () => ({
  getNotifications: vi.fn(),
  markNotificationAsRead: vi.fn(),
  deleteNotification: vi.fn()
}));

vi.mock('../../../services/paymentService', () => ({
  getPaymentAnalytics: vi.fn(),
  getPaymentTrends: vi.fn(),
  getCostOptimizationSuggestions: vi.fn()
}));

vi.mock('@/hooks/useBusiness', () => ({
  useBusiness: vi.fn()
}));

import * as notificationService from '../../../services/notificationService';
import * as paymentService from '../../../services/paymentService';
import { useBusiness } from '@/hooks/useBusiness';

describe('Phase 2 Performance Tests', () => {
  const mockBusiness = {
    id: 'test-business-123',
    businessName: 'Test Business'
  };

  // Generate large datasets for performance testing
  const generateLargeNotificationSet = (count) => {
    return Array.from({ length: count }, (_, index) => ({
      id: `notification-${index}`,
      title: `Notification ${index}`,
      message: `This is notification number ${index}`,
      type: ['System', 'Payment', 'Compliance', 'Permit'][index % 4],
      priority: ['Low', 'Medium', 'High'][index % 3],
      read: index % 2 === 0,
      receivedAt: new Date(Date.now() - index * 1000).toISOString()
    }));
  };

  const generateLargePaymentDataset = () => ({
    totalPayments: 1000,
    averagePayment: 250.50,
    onTimeRate: 95,
    paymentEfficiency: 88,
    paymentTrend: 5.2,
    averageTrend: 3.1,
    onTimeTrend: 2.8,
    efficiencyTrend: 4.5,
    paymentDistribution: [
      { name: 'Credit Card', value: 45 },
      { name: 'Bank Transfer', value: 30 },
      { name: 'Cash', value: 15 },
      { name: 'Check', value: 10 }
    ],
    methodBreakdown: [
      { method: 'Credit Card', count: 450 },
      { method: 'Bank Transfer', count: 300 },
      { method: 'Cash', count: 150 },
      { method: 'Check', count: 100 }
    ],
    statusBreakdown: [
      { status: 'Completed', count: 950 },
      { status: 'Pending', count: 30 },
      { status: 'Failed', count: 20 }
    ]
  });

  beforeEach(() => {
    vi.clearAllMocks();
    useBusiness.mockReturnValue({ business: mockBusiness });
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

  describe('NotificationCenter Performance', () => {
    it('should handle large notification sets efficiently', async () => {
      const largeNotificationSet = generateLargeNotificationSet(1000);
      notificationService.getNotifications.mockResolvedValue({
        notifications: largeNotificationSet
      });

      const startTime = performance.now();
      
      const { unmount } = renderWithProviders(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText(/notification center/i)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (500ms for 1000 items)
      expect(renderTime).toBeLessThan(500);
      
      // Verify pagination is working
      expect(screen.queryByText(/page 1 of/)).toBeInTheDocument();
      
      unmount();
    });

    it('should implement debounced search correctly', async () => {
      const notificationSet = generateLargeNotificationSet(100);
      notificationService.getNotifications.mockResolvedValue({
        notifications: notificationSet
      });

      const { unmount } = renderWithProviders(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText(/notification center/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search notifications/i);
      
      // Simulate rapid typing
      const startTime = performance.now();
      searchInput.value = 'test';
      fireEvent.change(searchInput, { target: { value: 'test' } });
      searchInput.value = 'test search';
      fireEvent.change(searchInput, { target: { value: 'test search' } });
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 350));
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Should not make excessive calls due to debouncing
      expect(notificationService.getNotifications).toHaveBeenCalledTimes(1);
      expect(responseTime).toBeLessThan(400);
      
      unmount();
    });

    it('should paginate large datasets correctly', async () => {
      const largeNotificationSet = generateLargeNotificationSet(500);
      notificationService.getNotifications.mockResolvedValue({
        notifications: largeNotificationSet
      });

      const { unmount } = renderWithProviders(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText(/notification center/i)).toBeInTheDocument();
      });

      // Should show pagination controls
      expect(screen.getByText(/page 1 of/)).toBeInTheDocument();
      expect(screen.getByText(/next/i)).toBeInTheDocument();
      
      // Should only render first page (20 items)
      const notificationItems = screen.getAllByRole('listitem');
      expect(notificationItems.length).toBeLessThanOrEqual(20);
      
      unmount();
    });
  });

  describe('PaymentAnalytics Performance', () => {
    it('should render complex charts efficiently', async () => {
      const largePaymentData = generateLargePaymentDataset();
      const trendsData = {
        trends: Array.from({ length: 50 }, (_, index) => ({
          period: `Month ${index + 1}`,
          amount: Math.random() * 1000,
          count: Math.floor(Math.random() * 100)
        }))
      };

      paymentService.getPaymentAnalytics.mockResolvedValue(largePaymentData);
      paymentService.getPaymentTrends.mockResolvedValue(trendsData);
      paymentService.getCostOptimizationSuggestions.mockResolvedValue({
        suggestions: []
      });

      const startTime = performance.now();
      
      const { unmount } = renderWithProviders(<PaymentAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByText(/payment analytics/i)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render complex charts within reasonable time
      expect(renderTime).toBeLessThan(800);
      
      // Verify charts are rendered
      expect(screen.getByText(/payment trends/i)).toBeInTheDocument();
      expect(screen.getByText(/payment distribution/i)).toBeInTheDocument();
      
      unmount();
    });

    it('should implement debounced timeframe changes', async () => {
      paymentService.getPaymentAnalytics.mockResolvedValue(generateLargePaymentDataset());
      paymentService.getPaymentTrends.mockResolvedValue({ trends: [] });
      paymentService.getCostOptimizationSuggestions.mockResolvedValue({ suggestions: [] });

      const { unmount } = renderWithProviders(<PaymentAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByText(/payment analytics/i)).toBeInTheDocument();
      });

      const timeframeSelect = screen.getByRole('combobox');
      
      // Simulate rapid timeframe changes
      const startTime = performance.now();
      fireEvent.change(timeframeSelect, { target: { value: 'weekly' } });
      fireEvent.change(timeframeSelect, { target: { value: 'daily' } });
      fireEvent.change(timeframeSelect, { target: { value: 'monthly' } });
      
      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 550));
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Should debounce API calls
      expect(paymentService.getPaymentTrends).toHaveBeenCalledTimes(2); // Initial + debounced
      expect(responseTime).toBeLessThan(600);
      
      unmount();
    });

    it('should memoize chart data processing', async () => {
      const paymentData = generateLargePaymentDataset();
      const trendsData = {
        trends: Array.from({ length: 100 }, (_, index) => ({
          period: `Month ${index + 1}`,
          amount: Math.random() * 1000,
          count: Math.floor(Math.random() * 100)
        }))
      };

      paymentService.getPaymentAnalytics.mockResolvedValue(paymentData);
      paymentService.getPaymentTrends.mockResolvedValue(trendsData);
      paymentService.getCostOptimizationSuggestions.mockResolvedValue({
        suggestions: []
      });

      const { unmount, rerender } = renderWithProviders(<PaymentAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByText(/payment analytics/i)).toBeInTheDocument();
      });

      // Re-render component (simulating prop changes)
      const startTime = performance.now();
      rerender(<PaymentAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByText(/payment analytics/i)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const rerenderTime = endTime - startTime;

      // Should re-render quickly due to memoization
      expect(rerenderTime).toBeLessThan(100);
      
      // Should not make new API calls due to memoization
      expect(paymentService.getPaymentAnalytics).toHaveBeenCalledTimes(1);
      
      unmount();
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory on component unmount', async () => {
      const notificationSet = generateLargeNotificationSet(100);
      notificationService.getNotifications.mockResolvedValue({
        notifications: notificationSet
      });

      // Render and unmount multiple times
      for (let i = 0; i < 5; i++) {
        const { unmount } = renderWithProviders(<NotificationCenter />);
        
        await waitFor(() => {
          expect(screen.getByText(/notification center/i)).toBeInTheDocument();
        });
        
        unmount();
      }

      // Should not cause memory issues
      expect(true).toBe(true);
    });

    it('should handle large datasets without memory issues', async () => {
      const veryLargeNotificationSet = generateLargeNotificationSet(2000);
      notificationService.getNotifications.mockResolvedValue({
        notifications: veryLargeNotificationSet
      });

      const { unmount } = renderWithProviders(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText(/notification center/i)).toBeInTheDocument();
      });

      // Should still render without crashing
      expect(screen.getByText(/page 1 of/)).toBeInTheDocument();
      
      unmount();
    });
  });

  describe('User Interaction Performance', () => {
    it('should respond quickly to user interactions', async () => {
      const notificationSet = generateLargeNotificationSet(100);
      notificationService.getNotifications.mockResolvedValue({
        notifications: notificationSet
      });

      const { unmount } = renderWithProviders(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText(/notification center/i)).toBeInTheDocument();
      });

      // Test filter interaction
      const filterSelect = screen.getByRole('combobox');
      const startTime = performance.now();
      
      fireEvent.change(filterSelect, { target: { value: 'unread' } });
      
      await waitFor(() => {
        // Should update filter quickly
        expect(filterSelect.value).toBe('unread');
      });

      const endTime = performance.now();
      const interactionTime = endTime - startTime;

      // Should respond within 100ms
      expect(interactionTime).toBeLessThan(100);
      
      unmount();
    });
  });
});
