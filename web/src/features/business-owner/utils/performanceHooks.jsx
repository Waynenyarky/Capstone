import { useMemo, useCallback, useRef, useEffect } from 'react';

/**
 * Performance optimization utilities for Phase 2 components
 */

/**
 * Debounce hook to prevent excessive function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const useDebounce = (func, delay) => {
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => func(...args), delay);
  }, [func, delay]);
};

/**
 * Throttle hook to limit function call frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const useThrottle = (func, limit) => {
  const inThrottle = useRef(false);

  return useCallback((...args) => {
    if (!inThrottle.current) {
      func.apply(this, args);
      inThrottle.current = true;
      setTimeout(() => inThrottle.current = false, limit);
    }
  }, [func, limit]);
};

/**
 * Memoized async data fetcher with caching
 * @param {Function} fetcher - Async fetch function
 * @param {Array} deps - Dependency array
 * @param {number} cacheTime - Cache time in milliseconds
 * @returns {Object} { data, loading, error, refetch }
 */
export const useAsyncData = (fetcher, deps = [], cacheTime = 300000) => {
  const cacheRef = useRef(new Map());
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null
  });

  const fetchData = useCallback(async () => {
    const cacheKey = JSON.stringify(deps);
    const cached = cacheRef.current.get(cacheKey);
    
    // Check cache
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      setState({ data: cached.data, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetcher();
      cacheRef.current.set(cacheKey, { data, timestamp: Date.now() });
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error });
    }
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
};

/**
 * Virtual scrolling hook for large lists
 * @param {Array} items - List items
 * @param {number} itemHeight - Height of each item
 * @param {number} containerHeight - Height of container
 * @returns {Object} Virtual scrolling properties
 */
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight
    }));
  }, [items, itemHeight, scrollTop, containerHeight]);

  const totalHeight = items.length * itemHeight;

  return {
    visibleItems,
    totalHeight,
    onScroll: useCallback((e) => setScrollTop(e.target.scrollTop), []),
    scrollTop
  };
};

/**
 * Lazy loading component wrapper
 * @param {React.Component} Component - Component to lazy load
 * @param {Object} options - Loading options
 * @returns {React.Component} Lazy loaded component
 */
export const withLazyLoading = (Component, options = {}) => {
  const LazyComponent = React.lazy(() => {
    return Promise.resolve({ default: Component });
  });

  return (props) => (
    <React.Suspense fallback={options.fallback || <div>Loading...</div>}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

/**
 * Performance monitoring hook
 * @param {string} componentName - Name of component being monitored
 * @returns {Object} Performance metrics
 */
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const renderTimes = useRef([]);

  useEffect(() => {
    renderCount.current++;
    const renderTime = performance.now();
    renderTimes.current.push(renderTime);

    // Keep only last 10 render times
    if (renderTimes.current.length > 10) {
      renderTimes.current.shift();
    }

    // Log performance warnings
    if (renderTimes.current.length > 1) {
      const lastRenderTime = renderTimes.current[renderTimes.current.length - 1];
      const prevRenderTime = renderTimes.current[renderTimes.current.length - 2];
      const renderDuration = lastRenderTime - prevRenderTime;

      if (renderDuration > 16) { // 60fps threshold
        console.warn(`${componentName} render took ${renderDuration.toFixed(2)}ms`);
      }
    }
  });

  const getMetrics = useCallback(() => ({
    renderCount: renderCount.current,
    averageRenderTime: renderTimes.current.length > 1
      ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
      : 0,
    lastRenderTime: renderTimes.current[renderTimes.current.length - 1] || 0
  }), []);

  return { getMetrics };
};

/**
 * Optimized pagination hook
 * @param {Array} data - Data to paginate
 * @param {number} pageSize - Page size
 * @returns {Object} Pagination properties
 */
export const usePagination = (data, pageSize = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize]);

  const totalPages = Math.ceil(data.length / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const nextPage = useCallback(() => {
    if (hasNextPage) setCurrentPage(prev => prev + 1);
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) setCurrentPage(prev => prev - 1);
  }, [hasPrevPage]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  return {
    currentPage,
    totalPages,
    paginatedData,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage
  };
};

/**
 * Memoized search functionality
 * @param {Array} data - Data to search
 * @param {Array} searchFields - Fields to search in
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered results
 */
export const useMemoizedSearch = (data, searchFields, searchTerm) => {
  return useMemo(() => {
    if (!searchTerm.trim()) return data;

    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return data.filter(item => 
      searchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(lowerSearchTerm);
      })
    );
  }, [data, searchFields, searchTerm]);
};

/**
 * Optimized resize observer hook
 * @param {React.RefObject} ref - Element ref
 * @param {Function} callback - Resize callback
 */
export const useResizeObserver = (ref, callback) => {
  const observerRef = useRef(null);

  useEffect(() => {
    if (ref.current) {
      observerRef.current = new ResizeObserver(callback);
      observerRef.current.observe(ref.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [ref, callback]);
};

/**
 * Performance-optimized event listener hook
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Array} deps - Dependencies
 */
export const useOptimizedEventListener = (event, handler, deps = []) => {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const optimizedHandler = (e) => handlerRef.current(e);
    
    window.addEventListener(event, optimizedHandler, { passive: true });
    
    return () => {
      window.removeEventListener(event, optimizedHandler);
    };
  }, [event, ...deps]);
};
