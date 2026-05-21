import { Typography, Grid } from 'antd'

const { Text } = Typography
const { useBreakpoint } = Grid

const LOGOS = [
  { src: '/government-logos/republic-of-philippines.png', alt: 'Republic of the Philippines' },
  { src: '/government-logos/bagong-pilipinas.png', alt: 'Bagong Pilipinas' },
  { src: '/government-logos/alaminos-city.png', alt: 'City of Alaminos' },
  { src: '/government-logos/pangasinan-province.png', alt: 'Province of Pangasinan' },
]

export default function GovernmentHeaderSection() {
  const screens = useBreakpoint()

  const logoSize = 44

  return (
    <div
      style={{
        padding: screens.md ? '16px 48px' : '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: screens.md ? 'flex-start' : 'center',
        gap: 6,
      }}
    >
      {/* Row 1 — Logos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {LOGOS.map((logo) => (
          <img
            key={logo.alt}
            src={logo.src}
            alt={logo.alt}
            style={{
              height: logoSize,
              width: logoSize,
              objectFit: 'contain',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ))}
      </div>

      {/* Row 2 — Text */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          textAlign: screens.md ? 'left' : 'center',
        }}
      >
        <Text style={{ fontSize: 13, color: '#555', lineHeight: 1.4 }}>
          Republic of the Philippines
        </Text>
        <Text style={{ fontSize: 13, color: '#333', lineHeight: 1.4 }}>
          Business Permits and Licensing Office (BPLO)
        </Text>
        <Text style={{ fontSize: 13, color: '#333', lineHeight: 1.4 }}>
          Alaminos City, Pangasinan
        </Text>
      </div>
    </div>
  )
}
