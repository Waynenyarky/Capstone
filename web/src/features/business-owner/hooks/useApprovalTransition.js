import { useState, useEffect } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { useBusiness } from '../../../../hooks/useBusiness';
import ApprovalTransitionBridge from '../components/approval/ApprovalTransitionBridge';
import OnboardingTour from '../components/approval/OnboardingTour';
import FeatureExposure from '../components/approval/FeatureExposure';

export const useApprovalTransition = (business) => {
  const { user } = useAuth();
  const { updateBusinessProfile } = useBusiness();
  
  const [showApprovalBridge, setShowApprovalBridge] = useState(false);
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);
  const [showFeatureExposure, setShowFeatureExposure] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Check if this is first-time approval
  const isFirstTimeApproval = business?.applicationStatus === 'approved' && 
                              !user?.hasSeenOnboarding &&
                              !user?.onboardingCompletedAt;

  // Check if user should see feature exposure
  const shouldShowFeatureExposure = user?.hasSeenOnboarding && 
                                   !user?.featureExposureCompleted;

  useEffect(() => {
    if (isFirstTimeApproval) {
      // Show approval bridge first
      setShowApprovalBridge(true);
    }
  }, [isFirstTimeApproval]);

  useEffect(() => {
    if (shouldShowFeatureExposure) {
      setShowFeatureExposure(true);
    }
  }, [shouldShowFeatureExposure]);

  const handleApprovalBridgeComplete = async () => {
    try {
      // Mark onboarding as completed
      await updateBusinessProfile(business.id, {
        hasSeenOnboarding: true,
        onboardingCompletedAt: new Date().toISOString()
      });

      setShowApprovalBridge(false);
      
      // Show onboarding tour after approval bridge
      setTimeout(() => {
        setShowOnboardingTour(true);
      }, 500);
      
      setCompletedSteps(prev => [...prev, 'approval_bridge']);
    } catch (error) {
      console.error('Error completing approval bridge:', error);
    }
  };

  const handleApprovalBridgeSkip = async () => {
    try {
      await updateBusinessProfile(business.id, {
        hasSeenOnboarding: true,
        onboardingSkippedAt: new Date().toISOString()
      });

      setShowApprovalBridge(false);
      setCompletedSteps(prev => [...prev, 'approval_bridge_skipped']);
    } catch (error) {
      console.error('Error skipping approval bridge:', error);
    }
  };

  const handleOnboardingTourComplete = async () => {
    try {
      setShowOnboardingTour(false);
      setCompletedSteps(prev => [...prev, 'onboarding_tour']);
      
      // Show feature exposure after tour
      setTimeout(() => {
        setShowFeatureExposure(true);
      }, 500);
    } catch (error) {
      console.error('Error completing onboarding tour:', error);
    }
  };

  const handleOnboardingTourSkip = async () => {
    setShowOnboardingTour(false);
    setCompletedSteps(prev => [...prev, 'onboarding_tour_skipped']);
  };

  const handleFeatureUnlock = async (featureId) => {
    try {
      // Track feature unlock
      await updateBusinessProfile(business.id, {
        unlockedFeatures: [...(business.unlockedFeatures || []), featureId],
        [`featureUnlocked_${featureId}`]: new Date().toISOString()
      });

      setCompletedSteps(prev => [...prev, `feature_${featureId}`]);
    } catch (error) {
      console.error('Error unlocking feature:', error);
    }
  };

  const handleFeatureExposureComplete = async () => {
    try {
      await updateBusinessProfile(business.id, {
        featureExposureCompleted: true,
        featureExposureCompletedAt: new Date().toISOString()
      });

      setShowFeatureExposure(false);
      setCompletedSteps(prev => [...prev, 'feature_exposure']);
    } catch (error) {
      console.error('Error completing feature exposure:', error);
    }
  };

  const components = {
    approvalBridge: (
      <ApprovalTransitionBridge
        business={business}
        onComplete={handleApprovalBridgeComplete}
        onSkip={handleApprovalBridgeSkip}
      />
    ),
    onboardingTour: (
      <OnboardingTour
        isOpen={showOnboardingTour}
        onClose={handleOnboardingTourComplete}
        business={business}
        user={user}
        completedSteps={completedSteps}
        onStepComplete={(step) => setCompletedSteps(prev => [...prev, step])}
      />
    ),
    featureExposure: (
      <FeatureExposure
        business={business}
        user={user}
        onFeatureUnlock={handleFeatureUnlock}
      />
    )
  };

  return {
    showApprovalBridge,
    showOnboardingTour,
    showFeatureExposure,
    completedSteps,
    components,
    isFirstTimeApproval,
    shouldShowFeatureExposure,
    handlers: {
      handleApprovalBridgeComplete,
      handleApprovalBridgeSkip,
      handleOnboardingTourComplete,
      handleOnboardingTourSkip,
      handleFeatureUnlock,
      handleFeatureExposureComplete
    }
  };
};

export default useApprovalTransition;
