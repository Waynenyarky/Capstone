import { UserOutlined, FormOutlined, SearchOutlined, QuestionCircleOutlined, ShopOutlined, EnvironmentOutlined } from '@ant-design/icons'

export const LOGOS = [
  { src: '/government-logos/republic-of-philippines.png', alt: 'Republic of the Philippines' },
  { src: '/government-logos/bagong-pilipinas.png', alt: 'Bagong Pilipinas' },
  { src: '/government-logos/alaminos-city.png', alt: 'City of Alaminos' },
  { src: '/government-logos/pangasinan-province.png', alt: 'Province of Pangasinan' },
]

export const BENTO_CARDS = [
  {
    id: 'bizclear',
    title: 'BizClear',
    description: 'An online business permit processing system of Business Permits and Licensing Office (BPLO) of Alaminos City, Pangasinan',
    icon: 'bizclear',
    span: 12,
    isTall: true,
  },
  {
    id: 'login',
    title: 'Login',
    icon: UserOutlined,
    span: 12,
    link: '/login',
    linkText: 'Access account →',
  },
  {
    id: 'apply-now',
    title: 'Apply Now',
    icon: FormOutlined,
    span: 12,
    link: '/apply',
    linkText: 'Begin →',
  },
  {
    id: 'track-application',
    title: 'Track Application',
    icon: SearchOutlined,
    span: 12,
    link: '/track',
    linkText: 'Check status →',
  },
  {
    id: 'business-search',
    title: 'Search A Business',
    icon: ShopOutlined,
    span: 12,
    link: '/business-search',
    linkText: 'Check status →',
  },
  {
    id: 'get-help',
    title: 'Get Help',
    icon: QuestionCircleOutlined,
    span: 12,
    scrollTo: 'faq-section',
    linkText: 'View FAQs →',
  },
  {
    id: 'office-location',
    title: 'Office Location',
    icon: EnvironmentOutlined,
    span: 12,
    scrollTo: 'office-location-section',
    linkText: 'Find us →',
  },
]

export const FAQ_ITEMS = [
  {
    key: 'faq-1',
    label: 'How long does permit processing usually take?',
    answer: 'Most complete applications move through initial review within 3 to 5 working days. Processing time can vary depending on document completeness and required agency clearances.',
  },
  {
    key: 'faq-2',
    label: 'Can I submit my application even if one document is pending?',
    answer: 'You can start your application and save progress, but final submission should include all required documents to avoid review delays and repeated verification requests.',
  },
  {
    key: 'faq-3',
    label: 'How will I know if my permit status changes?',
    answer: 'Status updates are posted in your portal account and may also be sent through your registered contact channels, depending on your account notification settings.',
  },
  {
    key: 'faq-4',
    label: 'What should I do if my application is returned for correction?',
    answer: 'Review the feedback note, update the requested details, and resubmit the corrected documents promptly. Keeping file names clear and readable helps speed up revalidation.',
  },
]
