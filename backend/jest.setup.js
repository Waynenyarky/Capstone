// Jest setup file for global test configuration and cleanup

afterAll(async () => {
  // Clear all intervals (from errorTracking and securityMonitor)
  try {
    // Get all active timers and clear them
    for (let id = 1; id < 10000; id++) {
      try {
        clearInterval(id);
      } catch (e) {
        // Ignore errors
      }
    }
  } catch (error) {
    // Ignore cleanup errors
  }

  // Cleanup blockchain services (if needed)
  try {
    // Blockchain services are in audit-service now
    // Cleanup is handled by individual services
  } catch (error) {
    // Ignore cleanup errors
  }

  // Ensure MongoDB connections are closed
  try {
    const mongoose = require('mongoose');
    // Close all connections
    const connections = mongoose.connections || [];
    await Promise.all(
      connections.map(conn => {
        if (conn.readyState !== 0) {
          return conn.close().catch(() => {});
        }
      })
    );
    // Also disconnect the default connection
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect().catch(() => {});
    }
  } catch (error) {
    // Ignore cleanup errors
  }

  // Give Jest a moment to clean up any remaining async operations
  await new Promise(resolve => setTimeout(resolve, 500));
}, 30000); // 30 second timeout for cleanup
