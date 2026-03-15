import { useState, useEffect } from 'react';

// Mock useBusiness hook for testing purposes
// In a real implementation, this would connect to your business API/context
export const useBusiness = () => {
  const [business, setBusiness] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock business data for development
  const mockBusiness = {
    id: 'business-123',
    businessName: 'Test Business',
    applicationStatus: 'approved',
    permitNumber: 'PERMIT-001',
    totalPayments: 0,
    inspectionsCompleted: 0,
    pendingInspections: 1,
    unreadNotifications: 3,
    unlockedFeatures: [],
    hasSeenOnboarding: false
  };

  const mockBusinesses = [
    mockBusiness,
    {
      id: 'business-456',
      businessName: 'Second Business',
      applicationStatus: 'active',
      permitNumber: 'PERMIT-002'
    }
  ];

  useEffect(() => {
    // Simulate loading business data
    setLoading(true);
    setTimeout(() => {
      setBusiness(mockBusiness);
      setBusinesses(mockBusinesses);
      setLoading(false);
    }, 100);
  }, []);

  const updateBusinessProfile = async (businessId, updates) => {
    setLoading(true);
    setError(null);
    try {
      // Mock update logic
      const updatedBusiness = { ...business, ...updates };
      setBusiness(updatedBusiness);
      
      // Update in businesses array if it exists there
      setBusinesses(prev => 
        prev.map(b => b.id === businessId ? { ...b, ...updates } : b)
      );
      
      return updatedBusiness;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createBusiness = async (businessData) => {
    setLoading(true);
    try {
      const newBusiness = {
        id: `business-${Date.now()}`,
        ...businessData,
        applicationStatus: 'pending',
        createdAt: new Date().toISOString()
      };
      
      setBusinesses(prev => [...prev, newBusiness]);
      return newBusiness;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteBusiness = async (businessId) => {
    setLoading(true);
    try {
      setBusinesses(prev => prev.filter(b => b.id !== businessId));
      if (business?.id === businessId) {
        setBusiness(null);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getBusinessById = (businessId) => {
    return businesses.find(b => b.id === businessId);
  };

  return {
    business,
    businesses,
    loading,
    error,
    updateBusinessProfile,
    createBusiness,
    deleteBusiness,
    getBusinessById,
    refreshBusiness: () => {
      // Mock refresh logic
      setLoading(true);
      setTimeout(() => {
        setBusiness(mockBusiness);
        setLoading(false);
      }, 100);
    }
  };
};

export default useBusiness;
