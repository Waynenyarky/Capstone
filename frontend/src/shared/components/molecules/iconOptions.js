import {
  AppstoreOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  ToolOutlined,
  MedicineBoxOutlined,
  PhoneOutlined,
  HeartOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  BookOutlined,
  CarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'

const DEFAULT_ICONS = [
  { value: 'home', label: 'Home', Icon: HomeOutlined },
  { value: 'user', label: 'User', Icon: UserOutlined },
  { value: 'team', label: 'Team', Icon: TeamOutlined },
  { value: 'calendar', label: 'Calendar', Icon: CalendarOutlined },
  { value: 'clock', label: 'Clock', Icon: ClockCircleOutlined },
  { value: 'medicine', label: 'Medicine', Icon: MedicineBoxOutlined },
  { value: 'phone', label: 'Phone', Icon: PhoneOutlined },
  { value: 'heart', label: 'Heart', Icon: HeartOutlined },
  { value: 'tools', label: 'Tools', Icon: ToolOutlined },
  { value: 'settings', label: 'Settings', Icon: SettingOutlined },
  { value: 'cart', label: 'Cart', Icon: ShoppingCartOutlined },
  { value: 'book', label: 'Book', Icon: BookOutlined },
  { value: 'car', label: 'Car', Icon: CarOutlined },
  { value: 'apps', label: 'Apps', Icon: AppstoreOutlined },
  { value: 'check', label: 'Check', Icon: CheckCircleOutlined },
]

export const iconOptions = DEFAULT_ICONS

export function getIconComponent(name, options = DEFAULT_ICONS) {
  const found = options.find((opt) => opt.value === name)
  return found?.Icon || null
}