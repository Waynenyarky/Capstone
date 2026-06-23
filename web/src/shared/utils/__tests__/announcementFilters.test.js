import { filterPublishedActiveAnnouncements } from '../announcementFilters.js'

describe('filterPublishedActiveAnnouncements', () => {
  const now = new Date()
  const past = new Date(now.getTime() - 86400000) // 1 day ago
  const future = new Date(now.getTime() + 86400000) // 1 day from now

  const mockAnnouncements = [
    {
      _id: '1',
      title: 'Published Active Public',
      status: 'published',
      isActive: true,
      audience: 'public',
      publishAt: null,
      expiresAt: null,
    },
    {
      _id: '2',
      title: 'Published Active Staff',
      status: 'published',
      isActive: true,
      audience: 'staff',
      publishAt: null,
      expiresAt: null,
    },
    {
      _id: '3',
      title: 'Draft',
      status: 'draft',
      isActive: true,
      audience: 'public',
      publishAt: null,
      expiresAt: null,
    },
    {
      _id: '4',
      title: 'Published Inactive',
      status: 'published',
      isActive: false,
      audience: 'public',
      publishAt: null,
      expiresAt: null,
    },
    {
      _id: '5',
      title: 'Scheduled Future',
      status: 'published',
      isActive: true,
      audience: 'public',
      publishAt: future.toISOString(),
      expiresAt: null,
    },
    {
      _id: '6',
      title: 'Expired',
      status: 'published',
      isActive: true,
      audience: 'public',
      publishAt: null,
      expiresAt: past.toISOString(),
    },
    {
      _id: '7',
      title: 'Published Past',
      status: 'published',
      isActive: true,
      audience: 'public',
      publishAt: past.toISOString(),
      expiresAt: null,
    },
    {
      _id: '8',
      title: 'Published With Future Expiry',
      status: 'published',
      isActive: true,
      audience: 'public',
      publishAt: null,
      expiresAt: future.toISOString(),
    },
  ]

  it('filters to published, active, and within date window for public audience', () => {
    const result = filterPublishedActiveAnnouncements(mockAnnouncements, { audience: 'public' })

    expect(result).toHaveLength(3)
    expect(result.map((a) => a.title)).toEqual([
      'Published Active Public',
      'Published Past',
      'Published With Future Expiry',
    ])
  })

  it('filters to published, active, and within date window for staff audience', () => {
    const result = filterPublishedActiveAnnouncements(mockAnnouncements, { audience: 'staff' })

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Published Active Staff')
  })

  it('excludes draft announcements', () => {
    const result = filterPublishedActiveAnnouncements(mockAnnouncements, { audience: 'public' })

    expect(result.some((a) => a.status === 'draft')).toBe(false)
  })

  it('excludes inactive announcements (isActive: false)', () => {
    const result = filterPublishedActiveAnnouncements(mockAnnouncements, { audience: 'public' })

    expect(result.some((a) => a.isActive === false)).toBe(false)
  })

  it('excludes scheduled future announcements (publishAt > now)', () => {
    const result = filterPublishedActiveAnnouncements(mockAnnouncements, { audience: 'public' })

    expect(result.some((a) => a.title === 'Scheduled Future')).toBe(false)
  })

  it('excludes expired announcements (expiresAt <= now)', () => {
    const result = filterPublishedActiveAnnouncements(mockAnnouncements, { audience: 'public' })

    expect(result.some((a) => a.title === 'Expired')).toBe(false)
  })

  it('returns empty array for non-array input', () => {
    const result = filterPublishedActiveAnnouncements(null, { audience: 'public' })
    expect(result).toEqual([])
  })

  it('returns empty array for undefined input', () => {
    const result = filterPublishedActiveAnnouncements(undefined, { audience: 'public' })
    expect(result).toEqual([])
  })

  it('filters without audience constraint when audience not provided', () => {
    const result = filterPublishedActiveAnnouncements(mockAnnouncements, {})

    expect(result).toHaveLength(4)
    expect(result.map((a) => a.title)).toContain('Published Active Public')
    expect(result.map((a) => a.title)).toContain('Published Active Staff')
  })
})
