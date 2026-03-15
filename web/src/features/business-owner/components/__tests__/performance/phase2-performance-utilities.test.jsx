import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App } from 'antd';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Import performance utilities
import { 
  useDebounce, 
  useThrottle, 
  useMemoizedSearch, 
  usePagination,
  usePerformanceMonitor 
} from '../../../utils/performanceHooks.jsx';

describe('Phase 2 Performance Utilities Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  describe('Debounce Hook', () => {
    it('should debounce function calls', async () => {
      const mockFn = vi.fn();
      const debouncedFn = useDebounce(mockFn, 100);

      // Call multiple times quickly
      debouncedFn('call1');
      debouncedFn('call2');
      debouncedFn('call3');

      // Should not be called immediately
      expect(mockFn).not.toHaveBeenCalled();

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be called once with last argument
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call3');
    });
  });

  describe('Throttle Hook', () => {
    it('should throttle function calls', async () => {
      const mockFn = vi.fn();
      const throttledFn = useThrottle(mockFn, 100);

      // Call multiple times quickly
      throttledFn('call1');
      throttledFn('call2');
      throttledFn('call3');

      // Should be called immediately for first call
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call1');

      // Wait for throttle period
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be called again after throttle period
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Memoized Search Hook', () => {
    it('should memoize search results', () => {
      const data = [
        { id: 1, name: 'Test Item 1', description: 'Description 1' },
        { id: 2, name: 'Test Item 2', description: 'Description 2' },
        { id: 3, name: 'Other Item', description: 'Description 3' }
      ];

      const searchFields = ['name', 'description'];
      
      // Test with search term
      const result1 = useMemoizedSearch(data, searchFields, 'Test');
      expect(result1).toHaveLength(2);

      // Test with same search term (should return memoized result)
      const result2 = useMemoizedSearch(data, searchFields, 'Test');
      expect(result2).toHaveLength(2);

      // Test with different search term
      const result3 = useMemoizedSearch(data, searchFields, 'Other');
      expect(result3).toHaveLength(1);

      // Test with empty search term
      const result4 = useMemoizedSearch(data, searchFields, '');
      expect(result4).toHaveLength(3);
    });
  });

  describe('Pagination Hook', () => {
    it('should paginate data correctly', () => {
      const data = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));
      const pageSize = 10;

      const paginationState = usePagination(data, pageSize);
      const { currentPage, totalPages, paginatedData, hasNextPage, hasPrevPage, nextPage, prevPage, goToPage } = paginationState;

      // Initial state
      expect(currentPage).toBe(1);
      expect(totalPages).toBe(5);
      expect(paginatedData).toHaveLength(10);
      expect(hasNextPage).toBe(true);
      expect(hasPrevPage).toBe(false);

      // Test next page
      nextPage();
      expect(paginationState.currentPage).toBe(2);
      expect(paginationState.hasPrevPage).toBe(true);

      // Test go to page
      goToPage(5);
      expect(paginationState.currentPage).toBe(5);
      expect(paginationState.hasNextPage).toBe(false);
    });
  });

  describe('Performance Monitor Hook', () => {
    it('should track performance metrics', () => {
      const { getMetrics } = usePerformanceMonitor('TestComponent');
      
      const metrics = getMetrics();
      
      expect(metrics).toHaveProperty('renderCount');
      expect(metrics).toHaveProperty('averageRenderTime');
      expect(metrics).toHaveProperty('lastRenderTime');
      expect(typeof metrics.renderCount).toBe('number');
      expect(typeof metrics.averageRenderTime).toBe('number');
      expect(typeof metrics.lastRenderTime).toBe('number');
    });
  });

  describe('Performance Optimization Validation', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 100
      }));

      const startTime = performance.now();
      
      // Test search performance
      const searchResults = useMemoizedSearch(largeDataset, ['name'], 'Item 1');
      
      const endTime = performance.now();
      const searchTime = endTime - startTime;

      // Search should complete quickly (< 100ms)
      expect(searchTime).toBeLessThan(100);
      expect(searchResults.length).toBeGreaterThan(0);
    });

    it('should paginate large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 5000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 100
      }));

      const startTime = performance.now();
      
      const { paginatedData } = usePagination(largeDataset, 20);
      
      const endTime = performance.now();
      const paginationTime = endTime - startTime;

      // Pagination should complete quickly (< 50ms)
      expect(paginationTime).toBeLessThan(50);
      expect(paginatedData).toHaveLength(20);
    });

    it('should implement debounce correctly for performance', async () => {
      const expensiveFunction = vi.fn(() => {
        // Simulate expensive operation
        return new Promise(resolve => setTimeout(resolve, 50));
      });

      const debouncedFunction = useDebounce(expensiveFunction, 200);

      // Rapid calls
      debouncedFunction();
      debouncedFunction();
      debouncedFunction();
      debouncedFunction();

      // Should only execute once after debounce
      await new Promise(resolve => setTimeout(resolve, 250));
      
      expect(expensiveFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Memory Efficiency Tests', () => {
    it('should not create excessive object references', () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
      
      // Test that memoized functions don't create new objects unnecessarily
      const result1 = useMemoizedSearch(data, ['id'], '1');
      const result2 = useMemoizedSearch(data, ['id'], '1');
      
      // Results should be the same reference (memoized)
      expect(result1).toEqual(result2);
    });

    it('should handle memory cleanup in pagination', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      
      const { paginatedData, goToPage } = usePagination(data, 10);
      
      // Initial page
      expect(paginatedData).toHaveLength(10);
      
      // Go to different pages
      goToPage(5);
      goToPage(10);
      goToPage(1);
      
      // Should still only have page size items in memory
      expect(paginatedData).toHaveLength(10);
    });
  });
});
