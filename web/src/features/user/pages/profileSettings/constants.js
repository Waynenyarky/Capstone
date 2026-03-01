import {
  UserOutlined,
  SafetyCertificateOutlined,
  BgColorsOutlined,
  BellOutlined,
  TabletOutlined,
  LockOutlined,
  MailOutlined,
  DesktopOutlined,
  DeleteOutlined,
  SettingOutlined,
} from '@ant-design/icons'

export const PROFILE_NAV_ITEMS = [
  { key: 'general', label: 'General', icon: UserOutlined },
  { key: 'account', label: 'Account', icon: SettingOutlined },
  { key: 'security', label: 'Security', icon: SafetyCertificateOutlined },
  { key: 'theme', label: 'Theme', icon: BgColorsOutlined },
  { key: 'notifications', label: 'Notifications', icon: BellOutlined },
]

/** Business owner: General, Account, Security, Theme (no Notifications). */
export const PROFILE_NAV_ITEMS_OWNER = PROFILE_NAV_ITEMS.filter((n) => n.key !== 'notifications')

/** Staff and admin: Account, Security, Theme only (no General, no Notifications). */
export const PROFILE_NAV_ITEMS_STAFF = PROFILE_NAV_ITEMS.filter(
  (n) => n.key !== 'general' && n.key !== 'notifications'
)

/** @deprecated Use PROFILE_NAV_ITEMS_STAFF for both staff and admin. */
export const PROFILE_NAV_ITEMS_STAFF_ADMIN = PROFILE_NAV_ITEMS_STAFF

/** Combined security + account sections (password and delete account only for business owner; passkey is part of MFA setup) */
export const SECURITY_SECTIONS = [
  { key: 'mfa', label: 'Two-Factor Authentication (MFA)', icon: TabletOutlined },
  { key: 'password', label: 'Password', icon: LockOutlined },
  { key: 'email', label: 'Email Address', icon: MailOutlined },
  { key: 'sessions', label: 'Active Sessions', icon: DesktopOutlined },
  { key: 'deleteAccount', label: 'Delete Account', icon: DeleteOutlined },
]

/** Subset for legacy Account tab (email + sessions); Security tab now includes these. */
export const ACCOUNT_SECTIONS = SECURITY_SECTIONS.filter((s) => s.key === 'email' || s.key === 'sessions')

export const THEME_OPTIONS = [
  { key: 'default', label: 'Default', header: '#ffffff', side: '#001529', content: '#f0f2f5', active: '#1677ff', border: '#f0f0f0' },
  { key: 'dark', label: 'Dark', header: '#141414', side: '#141414', content: '#000000', active: '#177ddc', border: '#303030' },
  { key: 'system', label: 'System', header: '#f5f5f5', side: '#e8e8e8', content: '#fafafa', active: '#1677ff', border: '#d9d9d9' },
  { key: 'document', label: 'Document', header: '#E5F8F0', side: '#E5F8F0', content: '#ffffff', active: '#00B96B', border: '#dbece5' },
  { key: 'blossom', label: 'Blossom', header: '#ffffff', side: '#ffffff', content: '#fff0f6', active: '#eb2f96', border: '#f0f0f0' },
  { key: 'sunset', label: 'Sunset', header: '#fff2e8', side: '#fff2e8', content: '#ffffff', active: '#fa541c', border: '#ffece0' },
  { key: 'royal', label: 'Royal', header: '#f9f0ff', side: '#f9f0ff', content: '#ffffff', active: '#722ed1', border: '#f5e6ff' },
]

export const PRESET_COLORS = [
  '#001529', '#1677FF', '#722ED1', '#13C2C2', '#52C41A', '#EB2F96', '#F5222D', '#FA8C16', '#FADB14', '#A0D911',
]
