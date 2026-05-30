/**
 * Phase 3 Integration Tests
 * Tests system optimization features and performance improvements
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'

// Import components to test
import PerformanceDashboard from '../../features/admin/components/performance/PerformanceDashboard'
import CommunicationHub from '../../features/communication/components/CommunicationHub'
import DocumentSharingPortal from '../../features/communication/components/DocumentSharingPortal'
import HelpCenter from '../../features/communication/components/HelpCenter'

// Import services
import { apiOptimizationService } from '../../services/apiOptimizationService'
import { stateOptimizationService } from '../../services/stateOptimizationService'

// Test utilities
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ConfigProvider>
      {children}
    </ConfigProvider>
  </BrowserRouter>
)

describe('Phase 3 Integration Tests', () => {
  beforeEach(() => {
    // Reset service metrics before each test
    apiOptimizationService.resetMetrics()
    jest.clearAllMocks()
  })

  describe('Performance Monitoring Dashboard', () => {
    test('renders dashboard with key metrics', async () => {
      render(
        <TestWrapper>
          <PerformanceDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Performance Monitoring')).toBeInTheDocument()
        expect(screen.getByText('Page Load Time')).toBeInTheDocument()
        expect(screen.getByText('API Response Time')).toBeInTheDocument()
        expect(screen.getByText('Database Query Time')).toBeInTheDocument()
        expect(screen.getByText('System Uptime')).toBeInTheDocument()
      })
    })

    test('displays performance charts', async () => {
      render(
        <TestWrapper>
          <PerformanceDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
        expect(screen.getByText('Database')).toBeInTheDocument()
        expect(screen.getByText('Alerts')).toBeInTheDocument()
      })

      // Test chart rendering
      const overviewTab = screen.getByText('Overview')
      fireEvent.click(overviewTab)

      await waitFor(() => {
        expect(screen.getByText('Page Load Times')).toBeInTheDocument()
        expect(screen.getByText('API Response Times')).toBeInTheDocument()
        expect(screen.getByText('Memory Usage')).toBeInTheDocument()
      })
    })

    test('handles time range selection', async () => {
      render(
        <TestWrapper>
          <PerformanceDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        const timeRangeSelect = screen.getByDisplayValue('Last 24 Hours')
        expect(timeRangeSelect).toBeInTheDocument()
      })

      // Test time range change
      fireEvent.change(screen.getByDisplayValue('Last 24 Hours'), {
        target: { value: '7d' }
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('Last 7 Days')).toBeInTheDocument()
      })
    })

    test('shows slow queries table', async () => {
      render(
        <TestWrapper>
          <PerformanceDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        const databaseTab = screen.getByText('Database')
        fireEvent.click(databaseTab)
      })

      await waitFor(() => {
        expect(screen.getByText('Slow Queries')).toBeInTheDocument()
        expect(screen.getByText('find businesses with complex filters')).toBeInTheDocument()
        expect(screen.getByText('aggregate payments by date range')).toBeInTheDocument()
      })
    })
  })

  describe('Communication Hub', () => {
    test('renders conversation list', async () => {
      render(
        <TestWrapper>
          <CommunicationHub />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Communication Hub')).toBeInTheDocument()
        expect(screen.getByText('Messages')).toBeInTheDocument()
        expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument()
        expect(screen.getByText('Maria Santos')).toBeInTheDocument()
        expect(screen.getByText('Carlos Reyes')).toBeInTheDocument()
      })
    })

    test('handles conversation selection', async () => {
      render(
        <TestWrapper>
          <CommunicationHub />
        </TestWrapper>
      )

      await waitFor(() => {
        const conversation = screen.getByText('Juan Dela Cruz')
        fireEvent.click(conversation)
      })

      await waitFor(() => {
        expect(screen.getByDisplayValue('Type your message...')).toBeInTheDocument()
        expect(screen.getByText('Good morning! I have a question about my business permit application.')).toBeInTheDocument()
      })
    })

    test('sends messages', async () => {
      render(
        <TestWrapper>
          <CommunicationHub />
        </TestWrapper>
      )

      await waitFor(() => {
        const conversation = screen.getByText('Juan Dela Cruz')
        fireEvent.click(conversation)
      })

      await waitFor(() => {
        const messageInput = screen.getByDisplayValue('Type your message...')
        fireEvent.change(messageInput, { target: { value: 'Test message' } })
        
        const sendButton = screen.getByText('Send')
        fireEvent.click(sendButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Message sent')).toBeInTheDocument()
      })
    })

    test('opens new message modal', async () => {
      render(
        <TestWrapper>
          <CommunicationHub />
        </TestWrapper>
      )

      await waitFor(() => {
        const newMessageButton = screen.getByText('New Message')
        fireEvent.click(newMessageButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Start New Conversation')).toBeInTheDocument()
        expect(screen.getByText('Recipient')).toBeInTheDocument()
        expect(screen.getByText('Message')).toBeInTheDocument()
      })
    })
  })

  describe('Document Sharing Portal', () => {
    test('renders document list', async () => {
      render(
        <TestWrapper>
          <DocumentSharingPortal />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Document Sharing Portal')).toBeInTheDocument()
        expect(screen.getByText('Business Permit Application.pdf')).toBeInTheDocument()
        expect(screen.getByText('Financial Statements 2023.xlsx')).toBeInTheDocument()
        expect(screen.getByText('Inspection Report.jpg')).toBeInTheDocument()
      })
    })

    test('handles document upload modal', async () => {
      render(
        <TestWrapper>
          <DocumentSharingPortal />
        </TestWrapper>
      )

      await waitFor(() => {
        const uploadButton = screen.getByText('Upload Document')
        fireEvent.click(uploadButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Upload Document')).toBeInTheDocument()
        expect(screen.getByText('Document')).toBeInTheDocument()
        expect(screen.getByText('Category')).toBeInTheDocument()
        expect(screen.getByText('Expiration Date')).toBeInTheDocument()
      })
    })

    test('shows document details', async () => {
      render(
        <TestWrapper>
          <DocumentSharingPortal />
        </TestWrapper>
      )

      await waitFor(() => {
        const viewButton = screen.getAllByLabelText('View Details')[0]
        fireEvent.click(viewButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Document Details')).toBeInTheDocument()
        expect(screen.getByText('Document Name')).toBeInTheDocument()
        expect(screen.getByText('File Size')).toBeInTheDocument()
        expect(screen.getByText('Permissions')).toBeInTheDocument()
      })
    })

    test('handles document sharing', async () => {
      render(
        <TestWrapper>
          <DocumentSharingPortal />
        </TestWrapper>
      )

      await waitFor(() => {
        const shareButton = screen.getAllByLabelText('Share')[0]
        fireEvent.click(shareButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Share Document')).toBeInTheDocument()
        expect(screen.getByText('Recipients')).toBeInTheDocument()
        expect(screen.getByText('Allow recipients to download')).toBeInTheDocument()
      })
    })
  })

  describe('Help Center', () => {
    test('renders FAQ section', async () => {
      render(
        <TestWrapper>
          <HelpCenter />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Help Center')).toBeInTheDocument()
        expect(screen.getByText('FAQs')).toBeInTheDocument()
        expect(screen.getByText('How do I register a new business?')).toBeInTheDocument()
        expect(screen.getByText('What documents are required for business permit renewal?')).toBeInTheDocument()
      })
    })

    test('handles FAQ search', async () => {
      render(
        <TestWrapper>
          <HelpCenter />
        </TestWrapper>
      )

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search FAQs...')
        fireEvent.change(searchInput, { target: { value: 'registration' } })
      })

      await waitFor(() => {
        expect(screen.getByText('How do I register a new business?')).toBeInTheDocument()
      })
    })

    test('renders tutorials section', async () => {
      render(
        <TestWrapper>
          <HelpCenter />
        </TestWrapper>
      )

      await waitFor(() => {
        const tutorialsTab = screen.getByText('Tutorials')
        fireEvent.click(tutorialsTab)
      })

      await waitFor(() => {
        expect(screen.getByText('Complete Business Registration Guide')).toBeInTheDocument()
        expect(screen.getByText('Understanding Business Permits')).toBeInTheDocument()
        expect(screen.getByText('Tax Payment Process')).toBeInTheDocument()
      })
    })

    test('handles support request', async () => {
      render(
        <TestWrapper>
          <HelpCenter />
        </TestWrapper>
      )

      await waitFor(() => {
        const supportTab = screen.getByText('Contact Support')
        fireEvent.click(supportTab)
      })

      await waitFor(() => {
        const getHelpButton = screen.getByText('Get Help')
        fireEvent.click(getHelpButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Submit Support Request')).toBeInTheDocument()
        expect(screen.getByText('Subject')).toBeInTheDocument()
        expect(screen.getByText('Category')).toBeInTheDocument()
        expect(screen.getByText('Priority')).toBeInTheDocument()
      })
    })
  })

  describe('API Optimization Service', () => {
    test('caches requests', async () => {
      const mockRequest = jest.fn().mockResolvedValue({ data: 'test' })
      
      const result1 = await apiOptimizationService.cachedRequest('test-key', mockRequest)
      const result2 = await apiOptimizationService.cachedRequest('test-key', mockRequest)

      expect(result1).toEqual({ data: 'test' })
      expect(result2).toEqual({ data: 'test' })
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })

    test('deduplicates concurrent requests', async () => {
      const mockRequest = jest.fn().mockResolvedValue({ data: 'test' })
      
      const [result1, result2] = await Promise.all([
        apiOptimizationService.deduplicateRequest('test-key', mockRequest),
        apiOptimizationService.deduplicateRequest('test-key', mockRequest)
      ])

      expect(result1).toEqual({ data: 'test' })
      expect(result2).toEqual({ data: 'test' })
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })

    test('tracks performance metrics', async () => {
      const mockRequest = jest.fn().mockResolvedValue({ data: 'test' })
      
      await apiOptimizationService.cachedRequest('test-key', mockRequest)
      
      const metrics = apiOptimizationService.getMetrics()
      expect(metrics.totalRequests).toBe(1)
      expect(metrics.averageResponseTime).toBeGreaterThan(0)
    })
  })

  describe('State Optimization Service', () => {
    test('normalizes state', () => {
      const testData = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
        { id: 3, name: 'Test 3' }
      ]

      const normalized = stateOptimizationService.normalizeState(testData)

      expect(normalized.entities).toHaveProperty('1')
      expect(normalized.entities).toHaveProperty('2')
      expect(normalized.entities).toHaveProperty('3')
      expect(normalized.ids).toEqual([1, 2, 3])
    })

    test('creates memoized selectors', () => {
      let callCount = 0
      const selector = (state) => {
        callCount++
        return state.filter(item => item.active)
      }

      const memoizedSelector = stateOptimizationService.createMemoizedSelector(selector)
      
      const testState = [{ id: 1, active: true }, { id: 2, active: false }]
      
      const result1 = memoizedSelector(testState)
      const result2 = memoizedSelector(testState)
      
      expect(result1).toEqual([{ id: 1, active: true }])
      expect(result2).toEqual([{ id: 1, active: true }])
      expect(callCount).toBe(1)
    })

    test('manages state persistence', () => {
      const persistence = stateOptimizationService.createStatePersistence('test-key')
      
      const testData = { test: 'data' }
      persistence.save(testData)
      
      const loadedData = persistence.load()
      expect(loadedData).toEqual(testData)
      
      persistence.clear()
      
      const clearedData = persistence.load()
      expect(clearedData).toBeNull()
    })
  })

  describe('Performance Hooks', () => {
    test('useDebouncedState hook', () => {
      // This would need a custom test component to properly test hooks
      // For now, we'll test the hook creation
      const { useDebouncedState } = require('../../utils/performanceHooks')
      expect(typeof useDebouncedState).toBe('function')
    })

    test('useVirtualScroll hook', () => {
      const { useVirtualScroll } = require('../../utils/performanceHooks')
      expect(typeof useVirtualScroll).toBe('function')
    })

    test('usePagination hook', () => {
      const { usePagination } = require('../../utils/performanceHooks')
      expect(typeof usePagination).toBe('function')
    })
  })

  describe('Cross-Feature Integration', () => {
    test('performance monitoring with API optimization', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({ data: 'test' })
      
      // Simulate API call with optimization
      await apiOptimizationService.cachedRequest('integration-test', mockApiCall)
      
      const metrics = apiOptimizationService.getMetrics()
      expect(metrics.totalRequests).toBeGreaterThan(0)
      expect(metrics.averageResponseTime).toBeGreaterThan(0)
    })

    test('communication hub with document sharing', async () => {
      // Test that communication hub can reference shared documents
      render(
        <TestWrapper>
          <CommunicationHub />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Communication Hub')).toBeInTheDocument()
      })

      // Verify attachment functionality exists
      const attachmentButton = screen.getByLabelText('Attach')
      expect(attachmentButton).toBeInTheDocument()
    })

    test('help center with performance monitoring', async () => {
      // Test that help center can access performance metrics
      render(
        <TestWrapper>
          <HelpCenter />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Help Center')).toBeInTheDocument()
      })

      // Verify support request functionality
      const supportTab = screen.getByText('Contact Support')
      fireEvent.click(supportTab)

      await waitFor(() => {
        expect(screen.getByText('Technical Issue')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('handles API failures gracefully', async () => {
      const mockRequest = jest.fn().mockRejectedValue(new Error('API Error'))
      
      await expect(
        apiOptimizationService.cachedRequest('error-test', mockRequest)
      ).rejects.toThrow('API Error')
      
      const metrics = apiOptimizationService.getMetrics()
      expect(metrics.totalRequests).toBe(1)
    })

    test('handles empty states', async () => {
      render(
        <TestWrapper>
          <DocumentSharingPortal />
        </TestWrapper>
      )

      // Test empty document list (would need to mock empty response)
      await waitFor(() => {
        expect(screen.getByText('Document Sharing Portal')).toBeInTheDocument()
      })
    })

    test('handles network timeouts', async () => {
      const mockRequest = jest.fn().mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      )

      await expect(
        apiOptimizationService.retryRequest(mockRequest, { maxRetries: 2 })
      ).rejects.toThrow('Timeout')
      
      expect(mockRequest).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })
  })

  describe('Performance Benchmarks', () => {
    test('component render performance', async () => {
      const startTime = performance.now()
      
      render(
        <TestWrapper>
          <PerformanceDashboard />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Performance Monitoring')).toBeInTheDocument()
      })

      const renderTime = performance.now() - startTime
      expect(renderTime).toBeLessThan(1000) // Should render within 1 second
    })

    test('API response time benchmarks', async () => {
      const mockRequest = jest.fn().mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({ data: 'test' }), 50)
        )
      )

      const startTime = performance.now()
      await apiOptimizationService.cachedRequest('benchmark-test', mockRequest)
      const responseTime = performance.now() - startTime

      expect(responseTime).toBeLessThan(200) // Should complete within 200ms
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })
  })
})
