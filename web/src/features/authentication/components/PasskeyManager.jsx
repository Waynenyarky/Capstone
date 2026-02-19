/**
 * Presentation Component: PasskeyManager (Refactored)
 * Main container component - orchestrates sub-components
 * Follows Clean Architecture: Presentation Layer only
 * For admins: disabling passkeys requires registering a new one first (replace flow).
 * For admins: only one super-auth method; enabling passkey disables TOTP (with confirmation).
 */
import React, { useState } from 'react'
import { Grid, Modal, Typography, theme } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { usePasskeyManager } from '@/features/authentication/presentation/passkey/hooks/usePasskeyManager'
import PasskeyStatusCard from '@/features/authentication/presentation/passkey/components/PasskeyStatusCard'
import PasskeyRegistrationGuide from '@/features/authentication/presentation/passkey/components/PasskeyRegistrationGuide'
import PasskeyDisableModal from '@/features/authentication/presentation/passkey/components/PasskeyDisableModal'
import PasskeyReplaceRequiredModal from '@/features/authentication/presentation/passkey/components/PasskeyReplaceRequiredModal'

const { useBreakpoint } = Grid
const { Paragraph } = Typography

export default function PasskeyManager({ isAdmin: isAdminProp, mfaEnabled = false, onRegistrationSuccess }) {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const { token } = theme.useToken()

  const {
    credentials,
    loading,
    registering,
    deleting,
    hasPasskeys,
    isAdmin: isAdminFromHook,
    handleRegister,
    handleDelete,
    handleDeleteAll,
  } = usePasskeyManager()

  const isAdmin = isAdminProp ?? isAdminFromHook

  const [guideModalVisible, setGuideModalVisible] = useState(false)
  const [disableModalVisible, setDisableModalVisible] = useState(false)
  const [replaceModalVisible, setReplaceModalVisible] = useState(false)
  const [switchConfirmVisible, setSwitchConfirmVisible] = useState(false)
  const [credIdsToRemoveAfterReplace, setCredIdsToRemoveAfterReplace] = useState([])

  const handleStartRegistration = async () => {
    setGuideModalVisible(false)
    const registered = await handleRegister()
    if (registered) {
      onRegistrationSuccess?.()
      if (credIdsToRemoveAfterReplace.length > 0) {
        for (const credId of credIdsToRemoveAfterReplace) {
          await handleDelete(credId)
        }
        setCredIdsToRemoveAfterReplace([])
      }
    }
  }

  const handleRegisterClick = () => {
    if (isAdmin && mfaEnabled) {
      setSwitchConfirmVisible(true)
    } else {
      setGuideModalVisible(true)
    }
  }

  const confirmSwitchToPasskey = () => {
    setSwitchConfirmVisible(false)
    setGuideModalVisible(true)
  }

  const handleDisableClick = () => {
    if (isAdmin && hasPasskeys) {
      setReplaceModalVisible(true)
    } else {
      setDisableModalVisible(true)
    }
  }

  const handleReplaceRegisterClick = () => {
    setReplaceModalVisible(false)
    setCredIdsToRemoveAfterReplace(credentials.map((c) => c.credId))
    setGuideModalVisible(true)
  }

  const handleGuideCancel = () => {
    setGuideModalVisible(false)
    setCredIdsToRemoveAfterReplace([])
  }

  return (
    <div>
      <PasskeyStatusCard
        hasPasskeys={hasPasskeys}
        credentialsCount={credentials.length}
        onRegister={handleRegisterClick}
        onDisable={handleDisableClick}
        deleting={deleting}
        registering={registering}
        loading={loading}
      />

      {/* Admin: switch from MFA to passkey confirmation */}
      <Modal
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExclamationCircleOutlined style={{ color: token.colorWarning, fontSize: 22 }} />
            Switch to Passkey
          </span>
        }
        open={switchConfirmVisible}
        onOk={confirmSwitchToPasskey}
        onCancel={() => setSwitchConfirmVisible(false)}
        okText="Continue"
        cancelText="Cancel"
        width={480}
        centered
      >
        <Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
          Enabling passkey will <strong>disable Two-Factor Authentication</strong> (authenticator app). You will use your passkey to sign in. Continue?
        </Paragraph>
      </Modal>

      <PasskeyRegistrationGuide
        visible={guideModalVisible}
        onCancel={handleGuideCancel}
        onStart={handleStartRegistration}
        registering={registering}
        isMobile={isMobile}
      />

      <PasskeyReplaceRequiredModal
        visible={replaceModalVisible}
        onRegister={handleReplaceRegisterClick}
        onCancel={() => setReplaceModalVisible(false)}
      />

      <PasskeyDisableModal
        visible={disableModalVisible}
        onOk={async () => {
          await handleDeleteAll()
          setDisableModalVisible(false)
        }}
        onCancel={() => setDisableModalVisible(false)}
        deleting={deleting}
      />
    </div>
  )
}
