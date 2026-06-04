import { useState, useEffect } from 'react';

// Mock useAuth hook for testing purposes
// In a real implementation, this would connect to your auth context/state management
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock user data for development
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'business_owner',
    hasSeenOnboarding: false,
    businesses: ['business-123'],
    subscriptionTier: 'basic'
  };

  useEffect(() => {
    // Simulate loading user data
    setLoading(true);
    setTimeout(() => {
      setUser(mockUser);
      setLoading(false);
    }, 100);
  }, []);

  const login = async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock login logic
      setUser(mockUser);
      return mockUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      setUser(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user
  };
};

export default useAuth;
