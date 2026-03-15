/**
 * Frontend Performance Monitoring
 * Measure component rendering times and API call performance
 */

// Performance monitoring utility
export class PerformanceMonitor {
    constructor() {
        this.measurements = [];
    }

    // Measure function execution time
    measureFunction(name, fn) {
        return (...args) => {
            const start = performance.now();
            const result = fn(...args);
            const end = performance.now();
            
            const duration = end - start;
            this.recordMeasurement(name, duration);
            
            console.log(`${name}: ${duration.toFixed(2)}ms`);
            return result;
        };
    }

    // Measure async function execution time
    async measureAsyncFunction(name, fn) {
        return async (...args) => {
            const start = performance.now();
            const result = await fn(...args);
            const end = performance.now();
            
            const duration = end - start;
            this.recordMeasurement(name, duration);
            
            console.log(`${name}: ${duration.toFixed(2)}ms`);
            return result;
        };
    }

    // Record a measurement
    recordMeasurement(name, duration) {
        this.measurements.push({
            name,
            duration,
            timestamp: new Date().toISOString()
        });
    }

    // Get performance report
    getReport() {
        const report = {};
        
        this.measurements.forEach(measurement => {
            if (!report[measurement.name]) {
                report[measurement.name] = {
                    count: 0,
                    total: 0,
                    min: Infinity,
                    max: -Infinity,
                    measurements: []
                };
            }
            
            const stats = report[measurement.name];
            stats.count++;
            stats.total += measurement.duration;
            stats.min = Math.min(stats.min, measurement.duration);
            stats.max = Math.max(stats.max, measurement.duration);
            stats.measurements.push(measurement.duration);
        });
        
        // Calculate averages
        Object.keys(report).forEach(name => {
            report[name].average = report[name].total / report[name].count;
        });
        
        return report;
    }

    // Print performance summary
    printSummary() {
        const report = this.getReport();
        
        console.log("=== Frontend Performance Report ===");
        Object.keys(report).forEach(name => {
            const stats = report[name];
            console.log(`\n${name}:`);
            console.log(`  Count: ${stats.count}`);
            console.log(`  Average: ${stats.average.toFixed(2)}ms`);
            console.log(`  Min: ${stats.min.toFixed(2)}ms`);
            console.log(`  Max: ${stats.max.toFixed(2)}ms`);
        });
    }
}

// Test specific components
export const runFrontendPerformanceTests = async () => {
    const monitor = new PerformanceMonitor();
    
    console.log("=== Frontend Performance Monitoring ===");
    
    // Test 1: Component rendering simulation
    const renderComponent = monitor.measureFunction("render_component", () => {
        // Simulate component rendering work
        const items = Array.from({length: 100}, (_, i) => ({
            id: i,
            name: `Item ${i}`,
            description: `Description for item ${i}`,
            status: i % 3 === 0 ? 'active' : 'inactive'
        }));
        
        // Simulate filtering/sorting work
        return items.filter(item => item.status === 'active')
                   .sort((a, b) => a.id - b.id);
    });
    
    // Run rendering test multiple times
    for (let i = 0; i < 3; i++) {
        renderComponent();
    }
    
    // Test 2: API call simulation
    const simulateApiCall = monitor.measureAsyncFunction("api_call", async (endpoint) => {
        // Simulate network delay and data processing
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        
        // Simulate data processing
        const response = {
            data: Array.from({length: 50}, (_, i) => ({
                id: i,
                value: Math.random() * 100
            }))
        };
        
        // Simulate data transformation
        return response.data.map(item => ({
            ...item,
            processed: true,
            category: item.value > 50 ? 'high' : 'low'
        }));
    });
    
    // Test API calls with different endpoints
    await simulateApiCall('/api/applications');
    await simulateApiCall('/api/businesses');
    await simulateApiCall('/api/permits');
    
    // Test 3: Form validation simulation
    const validateForm = monitor.measureFunction("form_validation", (formData) => {
        // Simulate complex form validation
        const errors = [];
        
        if (!formData.businessName || formData.businessName.length < 3) {
            errors.push('Business name must be at least 3 characters');
        }
        
        if (!formData.email || !formData.email.includes('@')) {
            errors.push('Valid email required');
        }
        
        if (formData.phone && formData.phone.length < 10) {
            errors.push('Phone number must be at least 10 digits');
        }
        
        // Simulate address validation
        if (formData.address) {
            const addressParts = formData.address.split(',').length;
            if (addressParts < 3) {
                errors.push('Please provide complete address');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    });
    
    // Test form validation with different data
    validateForm({ businessName: 'Test', email: 'test@example.com' });
    validateForm({ businessName: 'A', email: 'invalid' });
    validateForm({ businessName: 'Valid Business Name', email: 'valid@example.com', phone: '1234567890', address: '123 Main St, City, State' });
    
    // Print results
    monitor.printSummary();
    
    return monitor.getReport();
};

// Export for use in components
export default PerformanceMonitor;
