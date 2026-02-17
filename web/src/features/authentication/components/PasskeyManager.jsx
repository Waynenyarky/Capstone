/**
 * Presentation Component: PasskeyManager (Refactored)
 * Main container component - orchestrates sub-components
 * Follows Clean Architecture: Presentation Layer only
 */
import React, { useState } from 'react'
import { Button, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { Grid } from 'antd'
import { usePasskeyManager } from '@/features/authentication/presentation/passkey/hooks/usePasskeyManager'
import PasskeyStatusCard from '@/features/authentication/presentation/passkey/components/PasskeyStatusCard'
import PasskeyList from '@/features/authentication/presentation/passkey/components/PasskeyList'
import PasskeyRegistrationGuide from '@/features/authentication/presentation/passkey/components/PasskeyRegistrationGuide'
import PasskeyDisableModal from '@/features/authentication/presentation/passkey/components/PasskeyDisableModal'

const { useBreakpoint } = Grid

export default function PasskeyManager() {
  const screens = useBreakpoint()
  const isMobile = !screens.md
  
  const {
    credentials,
    loading,
    registering,
    deleting,
    hasPasskeys,
    handleRegister,
    handleDelete,
    handleDeleteAll,
  } = usePasskeyManager()

  const [guideModalVisible, setGuideModalVisible] = useState(false)
  const [disableModalVisible, setDisableModalVisible] = useState(false)

  const handleStartRegistration = async () => {
    setGuideModalVisible(false)
    await handleRegister()
  }

  return (
    <div>
      <PasskeyStatusCard
        hasPasskeys={hasPasskeys}
        credentialsCount={credentials.length}
        onRegister={() => setGuideModalVisible(true)}
        onDisable={() => setDisableModalVisible(true)}
        deleting={deleting}
        registering={registering}
        loading={loading}
      />

      <PasskeyList
        credentials={credentials}
        loading={loading}
        onDelete={handleDelete}
        deleting={deleting}
      />

      {hasPasskeys && (
        <Button
          type="default"
          icon={<PlusOutlined />}
          onClick={() => setGuideModalVisible(true)}
          loading={registering}
          disabled={registering}
        >
          Register Another Passkey
        </Button>
      )}

      <PasskeyRegistrationGuide
        visible={guideModalVisible}
        onCancel={() => setGuideModalVisible(false)}
        onStart={handleStartRegistration}
        registering={registering}
        isMobile={isMobile}
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
