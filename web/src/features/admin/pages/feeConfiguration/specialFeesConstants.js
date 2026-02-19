import {
  SafetyCertificateOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  FireOutlined,
  SlidersOutlined,
  BankOutlined,
  FileDoneOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
} from '@ant-design/icons'

/** Special fee section keys and labels for the two-panel Special Fees tab. Charter references in panel content. */
export const SPECIAL_FEE_SECTIONS = [
  { key: 'sanitary', label: 'Sanitary Inspection Fee', icon: SafetyCertificateOutlined },
  { key: 'businessPlate', label: 'Business Plate / Sticker', icon: IdcardOutlined },
  { key: 'environmental', label: 'Environmental Protection Fee', icon: EnvironmentOutlined },
  { key: 'fireSafety', label: 'Fire Safety Inspection Fee', icon: FireOutlined },
  { key: 'weightsAndMeasures', label: 'Weights and Measures', icon: SlidersOutlined },
  { key: 'communityTax', label: 'Community Tax', icon: BankOutlined },
  { key: 'barangayClearance', label: 'Barangay Business Clearance', icon: FileDoneOutlined },
  { key: 'specialPermit', label: 'Special Permit (Streamer, Motorcade)', icon: ThunderboltOutlined },
  { key: 'certification', label: 'Certification & Certified Copy', icon: FileTextOutlined },
]
