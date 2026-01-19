import React, { useState, useEffect } from 'react'
import { Layout, Row, Col, Card, Button, Typography, Space, Spin, theme } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { FormOutlined, ShopOutlined, ReloadOutlined } from '@ant-design/icons'
import { AppSidebar as Sidebar } from '@/features/authentication'
import BusinessOwnerLayout from '../components/BusinessOwnerLayout'
import BusinessRegistrationWizard from '../components/BusinessRegistrationWizard'
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

  if (!currentUser || role !== 'business_owner') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Redirecting..." />
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

  // If profile is not yet created (null) or in draft/revision mode, show the registration wizard
  if (!profile || profile.status === 'draft' || profile.status === 'needs_revision') {
    return (
      <BusinessOwnerLayout
        pageTitle="Business Registration"
        hiddenSidebarKeys={RESTRICTED_SIDEBAR_KEYS}
        sidebarOverrides={{ dashboard: { label: 'Business Registration', icon: <FormOutlined /> } }}
        hideSidebar={true}
        hideNotifications={true}
        hideProfileSettings={true}
      >
          <div>
            <Title level={2} style={{ marginBottom: 32 }}>Complete Business Registration</Title>
            <BusinessRegistrationWizard onComplete={() => window.location.reload()} />
          </div>
      </BusinessOwnerLayout>
    )
  }

  // Show business registration sidebar item if profile exists and is not in draft/needs_revision
  // This allows users to manage businesses after initial registration (pending_review or approved)
  const shouldShowBusinessRegistration = profile && profile.status !== 'draft' && profile.status !== 'needs_revision'
  
  return (
    <BusinessOwnerLayout 
      pageTitle="Dashboard" 
      businessName={profile?.businessName}
      hiddenSidebarKeys={!shouldShowBusinessRegistration ? ['business-registration'] : []}
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
                    onClick={() => navigate('/owner/business-registration')}
                    style={{ background: token.colorPrimary, borderColor: token.colorPrimary }}
                  >
                    My Businesses
                  </Button>
                )}
                <Button 
                  size="large" 
                  icon={<ReloadOutlined />}
                  onClick={() => navigate('/owner/business-renewal')}
                >
                  Business Renewal
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
