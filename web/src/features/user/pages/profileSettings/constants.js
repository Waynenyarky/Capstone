import {
  UserOutlined,
  SafetyCertificateOutlined,
  TabletOutlined,
  LockOutlined,
  MailOutlined,
  DesktopOutlined,
  DeleteOutlined,
  HomeOutlined,
  IdcardOutlined,
} from '@ant-design/icons'

export const PROFILE_NAV_ITEMS = [
  { key: 'general', label: 'General', icon: UserOutlined },
  { key: 'security', label: 'Security', icon: SafetyCertificateOutlined },
]

/** Business owner: General, Security, Theme (Account removed - merged into Security). */
export const PROFILE_NAV_ITEMS_OWNER = PROFILE_NAV_ITEMS

/** Staff and admin: Security, Theme only (no General, no Account). */
export const PROFILE_NAV_ITEMS_STAFF = PROFILE_NAV_ITEMS.filter(
  (n) => n.key !== 'general'
)

/** @deprecated Use PROFILE_NAV_ITEMS_STAFF for both staff and admin. */
export const PROFILE_NAV_ITEMS_STAFF_ADMIN = PROFILE_NAV_ITEMS_STAFF

/** Consolidated navigation items for all settings sections */
export const CONSOLIDATED_NAV_ITEMS = [
  // General section
  { key: 'basicInfo', label: 'Basic Information', icon: UserOutlined, section: 'general' },
  { key: 'address', label: 'Address', icon: HomeOutlined, section: 'general' },
  { key: 'personalInfo', label: 'Personal Information', icon: IdcardOutlined, section: 'general' },
  
  // Security section  
  { key: 'mfa', label: 'Multi-Factor Authentication', icon: TabletOutlined, section: 'security' },
  { key: 'password', label: 'Password', icon: LockOutlined, section: 'security' },
  { key: 'email', label: 'Email Address', icon: MailOutlined, section: 'security' },
  { key: 'sessions', label: 'Active Sessions', icon: DesktopOutlined, section: 'security' },
  { key: 'deleteAccount', label: 'Delete Account', icon: DeleteOutlined, section: 'security' },
]

/** General sections for profile information */
export const GENERAL_SECTIONS = [
  { key: 'basicInfo', label: 'Basic Information', icon: UserOutlined },
  { key: 'address', label: 'Address', icon: HomeOutlined },
  { key: 'personalInfo', label: 'Personal Information', icon: IdcardOutlined },
]

/** Security sections (includes email and sessions from former Account tab) */
export const SECURITY_SECTIONS = [
  { key: 'mfa', label: 'Multi-Factor Authentication (MFA)', icon: TabletOutlined },
  { key: 'password', label: 'Password', icon: LockOutlined },
  { key: 'email', label: 'Email Address', icon: MailOutlined },
  { key: 'sessions', label: 'Active Sessions', icon: DesktopOutlined },
  { key: 'deleteAccount', label: 'Delete Account', icon: DeleteOutlined },
]

/** @deprecated - Account sections moved to Security tab */
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
