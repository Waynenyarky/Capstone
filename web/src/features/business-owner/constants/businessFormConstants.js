const ALAMINOS_TEST_ADDRESS = {
  streetAddress: '123 Rizal Street',
  province: '015500000',
  provinceName: 'Pangasinan',
  city: '015503000',
  cityName: 'City of Alaminos',
  barangay: '015503021',
  barangayName: 'Poblacion',
  postalCode: '2404',
}

const GENERAL_PERMIT_CATEGORIES = [
  {
    value: 'cooperative',
    label: 'Cooperative',
    description: 'For registered cooperatives operating within the city',
    bestFor: ['Agricultural cooperatives', 'Consumer cooperatives', 'Multi-purpose cooperatives'],
    icon: 'TeamOutlined'
  },
  {
    value: 'association_foundation',
    label: 'Association / Foundation',
    description: 'For non-profit organizations and foundations',
    bestFor: ['Civic organizations', 'Charitable foundations', 'Professional associations'],
    icon: 'HeartOutlined'
  },
  {
    value: 'chainsaw',
    label: 'Chainsaw Permit',
    description: 'For businesses requiring chainsaw operations for logging or tree cutting',
    bestFor: ['Logging operations', 'Tree cutting services', 'Land clearing'],
    icon: 'ToolOutlined'
  },
  {
    value: 'firecrackers_stallholders',
    label: 'Firecrackers Stallholders',
    description: 'For temporary stalls selling firecrackers during holiday seasons',
    bestFor: ['Christmas season vendors', 'New Year vendors', 'Holiday firework sellers'],
    icon: 'FireOutlined'
  },
  {
    value: 'bazaar_festival_vendors',
    label: 'Bazaar / Festival Vendors',
    description: 'For vendors participating in city festivals, bazaars, or special events',
    bestFor: ['Festival participants', 'Trade fair vendors', 'Weekend market sellers'],
    icon: 'GiftOutlined'
  },
  {
    value: 'peddlers',
    label: 'Peddlers',
    description: 'For mobile vendors selling goods from house to house or street vending',
    bestFor: ['Door-to-door sellers', 'Street vendors', 'Mobile food carts'],
    icon: 'ShoppingCartOutlined'
  },
  {
    value: 'promotional_temporary_stalls',
    label: 'Promotional / Temporary Stalls',
    description: 'For short-term promotional booths or temporary business stalls',
    bestFor: ['Product launches', 'Seasonal sales', 'Promotional events'],
    icon: 'RiseOutlined'
  },
  {
    value: 'market_stallholders',
    label: 'Market Stallholders',
    description: 'For fixed stalls in public markets or wet markets',
    bestFor: ['Public market vendors', 'Wet market sellers', 'Fixed stall operators'],
    icon: 'ShopOutlined'
  },
  {
    value: 'fishpond',
    label: 'Fishpond Permit',
    description: 'For fishpond operators and aquaculture businesses',
    bestFor: ['Fish pond owners', 'Aquaculture operators', 'Fish farming'],
    icon: 'ExperimentOutlined'
  },
  {
    value: 'sand_gravel',
    label: 'Sand and Gravel Permit',
    description: 'For businesses extracting or dealing with sand, gravel, and construction materials',
    bestFor: ['Sand and gravel extraction', 'Construction material suppliers', 'Quarry operations'],
    icon: 'BlockOutlined'
  },
  {
    value: 'warehouse_storage',
    label: 'Warehouse / Storage Facility',
    description: 'For warehousing and storage facility operations',
    bestFor: ['Warehouse operators', 'Cold storage facilities', 'Logistics centers'],
    icon: 'InboxOutlined'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'For other types of temporary permits not covered above',
    bestFor: ['Special cases', 'Custom permits', 'Other temporary operations'],
    icon: 'MoreOutlined'
  },
]

export { ALAMINOS_TEST_ADDRESS, GENERAL_PERMIT_CATEGORIES }
