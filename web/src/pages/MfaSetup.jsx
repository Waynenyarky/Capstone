import React from 'react'
import { Layout, Row, Col, Button, Card, Input, Spin, Typography } from 'antd'
import QrDisplay from '@/features/authentication/components/QrDisplay.jsx'
import { useMfaSetup } from '@/features/authentication/hooks'

export default function MfaSetup() {
  const {
    loading, qrDataUrl, uri, secret, code, setCode, enabled,
    // statusFetchFailed,
    handleSetup, handleVerify, handleDisable, 
   } = useMfaSetup()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: 24 }}>
        <Row justify="center">
          <Col style={{ width: 520 }}>
            <Card title="Multi-factor Authentication (TOTP)">
              <div style={{ marginBottom: 12 }}>
                <p><strong>Status:</strong> {enabled ? 'Enabled' : 'Disabled'}</p>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Button type="primary" onClick={handleSetup} disabled={loading || enabled}>Setup Authenticator</Button>
                <Button style={{ marginLeft: 8 }} danger onClick={handleDisable} disabled={loading || !enabled}>Disable MFA</Button>
              </div>
              {loading ? <Spin /> : null}
              {(qrDataUrl || uri) ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
                  <div><QrDisplay dataUrl={qrDataUrl} uri={uri} size={160} /></div>
                  <div style={{ flex: 1 }}>
                    <p>Scan the QR code above with Google Authenticator, Authy, or similar.</p>
                    <p><strong>Secret:</strong> <code>{secret}</code></p>
                    <div style={{ marginTop: 8 }}>
                      <label>Enter code from app</label>
                      <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D+/g, '').slice(0,6))} style={{ width: 160, marginRight: 8 }} />
                      <Button type="primary" onClick={handleVerify}>Verify & Enable</Button>
                    </div>
                  </div>
                </div>
               ) : null}
            </Card>
          </Col>
        </Row>
      </Layout.Content>
    </Layout>
   )
}
