import React, { useState, useEffect } from 'react'
import { Layout, Row, Col, Card, Button, Typography, Space, Spin, theme } from 'antd'
import { useNavigate } from 'react-router-dom'
import { ShopOutlined, ReloadOutlined } from '@ant-design/icons'
import { AppSidebar as Sidebar } from '@/features/authentication'
import BusinessOwnerLayout from '../components/BusinessOwnerLayout'
import { useBusinessOwnerDashboard } from '../../hooks/useBusinessOwnerDashboard'

// Dashboard Feature Imports
import ComplianceStatus from '../../features/dashboard/components/ComplianceStatus'
import PermitSummary from '../../features/dashboard/components/PermitSummary'
import PaymentsDue from '../../features/dashboard/components/PaymentsDue'
import InspectionsViolations from '../../features/dashboard/components/InspectionsViolations'
import Appeals from '../../features/dashboard/components/Appeals'
import Notifications from '../../features/dashboard/components/Notifications'
import BusinessProfile from '../../features/dashboard/components/BusinessProfile'
import Documents from '../../features/dashboard/components/Documents'
import AuditTrail from '../../features/dashboard/components/AuditTrail'
import AISuggestions from '../../features/dashboard/components/AISuggestions'

const { Title, Paragraph } = Typography

export default function BusinessOwnerDashboard() {
  const navigate = useNavigate()
  const { 
    currentUser, 
    role, 
    profile, 
    loading, 
    fetchError, 
    dashboardLoading, 
    dashboardData 
  } = useBusinessOwnerDashboard()
  
  const { token } = theme.useToken()

  const roleSlug = String(role?.slug ?? role ?? '').toLowerCase()
  if (!currentUser || roleSlug !== 'business_owner') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Redirecting..."><div style={{ minHeight: 48 }} /></Spin>
      </div>
    )
  }

  // Keys to hide if business registration is not complete
  // Hide everything except dashboard (which shows the wizard) and logout
  const RESTRICTED_SIDEBAR_KEYS = ['permit-apps', 'cessation', 'payments', 'appeals', 'profile']

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large"><div style={{ marginTop: 16 }}>Loading Profile...</div></Spin>
      </div>
    )
  }

  if (fetchError) {
    return (
      <BusinessOwnerLayout pageTitle="Error">
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Title level={4} type="danger">Failed to load profile</Title>
          <Paragraph>{fetchError.message || 'Unknown error occurred'}</Paragraph>
          <Button type="primary" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </BusinessOwnerLayout>
    )
  }

  // Dev-only: skip registration wizard for seeded business owner (business@example.com)
  const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true
  const isSeededBusinessOwner = currentUser?.email === 'business@example.com'
  const wouldShowWizard = !profile || profile.status === 'draft' || profile.status === 'needs_revision'
  const skipWizardForDev = isDev && isSeededBusinessOwner && wouldShowWizard
  const effectiveProfile = skipWizardForDev
    ? { ...(profile || {}), status: 'pending_review', businessName: (profile && profile.businessName) || 'My Business' }
    : profile

  // If profile is not yet created (null) or in draft/revision mode, show CTA to My Businesses (Option B: business-first)
  if (wouldShowWizard && !skipWizardForDev) {
    return (
      <BusinessOwnerLayout
        pageTitle="My Businesses"
        hiddenSidebarKeys={RESTRICTED_SIDEBAR_KEYS}
      >
        <div style={{ padding: 48, textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
          <Title level={3} style={{ color: token.colorPrimary, marginBottom: 16 }}>Add your first business</Title>
          <Paragraph type="secondary" style={{ marginBottom: 24 }}>
            Create a business, then apply for its permit from My Businesses.
          </Paragraph>
          <Button
            type="primary"
            size="large"
            icon={<ShopOutlined />}
            onClick={() => navigate('/owner/businesses')}
            style={{ background: token.colorPrimary, borderColor: token.colorPrimary }}
          >
            Go to My Businesses
          </Button>
        </div>
      </BusinessOwnerLayout>
    )
  }

  // Show business registration sidebar item if profile exists and is not in draft/needs_revision
  // This allows users to manage businesses after initial registration (pending_review or approved)
  const shouldShowBusinessRegistration = effectiveProfile && effectiveProfile.status !== 'draft' && effectiveProfile.status !== 'needs_revision'
  
  return (
    <BusinessOwnerLayout 
      pageTitle="Dashboard" 
      businessName={effectiveProfile?.businessName}
      hiddenSidebarKeys={!shouldShowBusinessRegistration ? ['business-registration'] : []}
      showPageHeader={false}
    >
        {dashboardLoading ? (
           <div style={{ textAlign: 'center', padding: 50 }}>
             <Spin size="large" />
           </div>
        ) : (
          <div style={{ paddingBottom: 24 }}>
            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
              <div>
                <Title level={2} style={{ margin: 0, color: token.colorPrimary }}>Welcome back, {currentUser?.firstName || 'Owner'}</Title>
                <Paragraph type="secondary" style={{ fontSize: 16, margin: 0 }}>Here is your business overview for {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Paragraph>
              </div>
              <Space>
                {shouldShowBusinessRegistration && (
                  <Button 
                    type="primary"
                    icon={<ShopOutlined />} 
                    size="large"
                    onClick={() => navigate('/owner/businesses')}
                    style={{ background: token.colorPrimary, borderColor: token.colorPrimary }}
                  >
                    My Businesses
                  </Button>
                )}
                <Button 
                  size="large" 
                  icon={<ReloadOutlined />}
                  onClick={() => navigate('/owner/businesses?tab=permits')}
                >
                  Permit applications
                </Button>
              </Space>
            </div>

            {/* Compliance Status (Top Priority) */}
            <div style={{ marginBottom: 24 }}>
               <ComplianceStatus data={dashboardData?.compliance} />
            </div>

            <Row gutter={[24, 24]}>
              {/* Permit Summary */}
              <Col xs={24} lg={12} xl={8}>
                 <PermitSummary data={dashboardData?.permits} />
              </Col>

              {/* Payments Due */}
              <Col xs={24} lg={12} xl={8}>
                 <PaymentsDue data={dashboardData?.payments} />
              </Col>

              {/* Inspections & Violations */}
              <Col xs={24} lg={12} xl={8}>
                 <InspectionsViolations data={dashboardData?.inspections} />
              </Col>

              {/* Appeals */}
              <Col xs={24} lg={12} xl={8}>
                 <Appeals data={dashboardData?.appeals} />
              </Col>

              {/* Notifications */}
              <Col xs={24} lg={12} xl={8}>
                 <Notifications data={dashboardData?.notifications} />
              </Col>

              {/* Business Profile */}
              <Col xs={24} lg={12} xl={8}>
                 <BusinessProfile 
                   data={dashboardData?.businessProfile}
                 />
              </Col>

              {/* Documents */}
              <Col xs={24} lg={12} xl={12}>
                 <Documents data={dashboardData?.documents} />
              </Col>

              {/* Audit Trail */}
              <Col xs={24} lg={12} xl={12}>
                 <AuditTrail data={dashboardData?.auditTrail} />
              </Col>
            </Row>

            {/* AI Suggestions (Bottom) */}
            <AISuggestions data={dashboardData?.aiSuggestions} />
          </div>
        )}
    </BusinessOwnerLayout>
  )
}
