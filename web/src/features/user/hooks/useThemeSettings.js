import { useState, useEffect } from 'react'
import { theme } from 'antd'
import { useAppTheme, THEMES } from '@/shared/theme/ThemeProvider'
import { THEME_OPTIONS, PRESET_COLORS } from '@/features/user/pages/profileSettings/constants'

export function useThemeSettings(messageApi) {
  const { token } = theme.useToken()
  const {
    currentTheme,
    setTheme,
    themeOverrides,
    setThemeOverrides,
    replaceThemeOverrides,
    setPreviewTheme,
    setPreviewOverrides,
    savedTheme,
  } = useAppTheme()

  const [pendingTheme, setPendingTheme] = useState(savedTheme || currentTheme)
  const [pendingOverrides, setPendingOverrides] = useState(themeOverrides)
  const [hoveredTheme, setHoveredTheme] = useState(null)

  useEffect(() => {
    setPendingTheme(savedTheme)
    setPendingOverrides(themeOverrides)
  }, [savedTheme, themeOverrides])

  useEffect(() => {
    return () => {
      setPreviewTheme(null)
      setPreviewOverrides(null)
    }
  }, [setPreviewTheme, setPreviewOverrides])

  const handleMouseEnter = (key) => {
    setHoveredTheme(key)
    setPreviewTheme(key)
    if (key === THEMES.DOCUMENT || key === THEMES.DARK || key === THEMES.DEFAULT) {
      const overridesWithoutColor = { ...pendingOverrides }
      delete overridesWithoutColor.colorPrimary
      setPreviewOverrides(overridesWithoutColor)
    } else {
      setPreviewOverrides(pendingOverrides)
    }
  }

  const handleMouseLeave = () => {
    setHoveredTheme(null)
    setPreviewTheme(pendingTheme)
    setPreviewOverrides(pendingOverrides)
  }

  const handleSelectTheme = (key) => {
    setPendingTheme(key)
    setPreviewTheme(key)
    if (key === THEMES.DEFAULT || key === THEMES.DOCUMENT || key === THEMES.DARK) {
      const overridesWithoutColor = { ...pendingOverrides }
      delete overridesWithoutColor.colorPrimary
      setPendingOverrides(overridesWithoutColor)
      setPreviewOverrides(overridesWithoutColor)
    } else {
      const themeDefaults = {
        [THEMES.BLOSSOM]: '#eb2f96',
        [THEMES.SUNSET]: '#fa541c',
        [THEMES.ROYAL]: '#722ed1',
      }
      if (!pendingOverrides.colorPrimary && themeDefaults[key]) {
        const newOverrides = { ...pendingOverrides, colorPrimary: themeDefaults[key] }
        setPendingOverrides(newOverrides)
        setPreviewOverrides(newOverrides)
      } else {
        setPreviewOverrides(pendingOverrides)
      }
    }
  }

  const handleApplyTheme = () => {
    setTheme(pendingTheme)
    if (replaceThemeOverrides) {
      replaceThemeOverrides(pendingOverrides)
    } else {
      setThemeOverrides(pendingOverrides)
    }
    setPreviewTheme(null)
    setPreviewOverrides(null)
    messageApi?.success('Theme applied successfully')
  }

  const handleColorMouseEnter = (color) => {
    setPreviewOverrides({ ...pendingOverrides, colorPrimary: color })
  }

  const handleColorMouseLeave = () => {
    setPreviewOverrides(pendingOverrides)
  }

  const handleColorChange = (value) => {
    const colorHex = typeof value === 'string' ? value : value.toHexString()
    const nextOverrides = { ...pendingOverrides, colorPrimary: colorHex }
    setPendingOverrides(nextOverrides)
    setPreviewOverrides(nextOverrides)
  }

  const themeOptions = THEME_OPTIONS.map((opt) => ({
    ...opt,
    key: opt.key,
  }))

  return {
    themeOptions,
    presetColors: PRESET_COLORS,
    pendingTheme,
    pendingOverrides,
    hoveredTheme,
    currentPrimaryColor: pendingOverrides.colorPrimary || token.colorPrimary,
    handleMouseEnter,
    handleMouseLeave,
    handleSelectTheme,
    handleApplyTheme,
    handleColorMouseEnter,
    handleColorMouseLeave,
    handleColorChange,
  }
}
