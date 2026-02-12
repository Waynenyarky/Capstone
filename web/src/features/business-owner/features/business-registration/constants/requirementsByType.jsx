/**
 * Requirements by PSIC 2019 section (Philippine Standard Industrial Classification)
 * Sector-specific requirements in addition to general LGU/BIR requirements.
 */
export const requirementsByType = {
  general: [
    {
      category: 'Local Government Unit (LGU)',
      items: [
        'Duly accomplished application form',
        'Two 2×2 ID photos',
        'Valid IDs of the business owner',
        'Barangay business clearance',
        'Occupancy permit (if applicable)',
        'Fire Safety Inspection Certificate',
        'Community Tax Certificate (CTC)',
        'Lease contract or land title (if applicable)',
        'Other applicable national or sectoral requirements'
      ]
    },
    {
      category: 'Bureau of Internal Revenue (BIR)',
      items: [
        "Mayor's permit or proof of ongoing LGU application",
        'DTI / SEC / CDA registration',
        'Barangay clearance',
        'Valid government-issued ID of the business owner',
        'Lease contract or land title'
      ]
    },
    {
      category: 'Other Government Agencies (if applicable)',
      items: [
        'Social Security System (SSS)',
        'PhilHealth',
        'Pag-IBIG Fund'
      ]
    }
  ],
  // i - Accommodation and food service activities
  i: [
    {
      category: 'Food and Beverage',
      items: [
        'Sanitary permit and health certificate',
        'Food safety training certificates (if required)',
        'FDA permit or license (if applicable)'
      ]
    }
  ],
  // c - Manufacturing
  c: [
    {
      category: 'Manufacturing / Industrial',
      items: [
        'DENR environmental compliance certificate (ECC) if required',
        'Waste disposal agreement or proof of disposal service',
        'Safety compliance certificates (if applicable)'
      ]
    }
  ],
  // h - Transport and storage
  h: [
    {
      category: 'Transportation / Logistics',
      items: [
        'LTFRB or relevant transport franchise (if applicable)',
        'Vehicle registration documents',
        'Driver credentials and certifications'
      ]
    }
  ],
  // a - Agriculture, forestry and fishing
  a: [
    {
      category: 'Agriculture / Fishery / Forestry',
      items: [
        'Bureau of Fisheries and Aquatic Resources (if applicable)',
        'DA or related permits for regulated products'
      ]
    }
  ],
  // f - Construction
  f: [
    {
      category: 'Construction / Real Estate / Housing',
      items: [
        'PCAB license (if applicable)',
        'Building and occupancy permits (if applicable)',
        'Engineers/architects licenses for regulated work'
      ]
    }
  ],
  // k - Financial and insurance activities
  k: [
    {
      category: 'Financial / Insurance / Banking',
      items: [
        'SEC registration (if required)',
        'BSP/IC or relevant regulator approvals (if applicable)',
        'Compliance and risk disclosures'
      ]
    }
  ]
}

export function getRequirementsForType(businessType) {
  const base = requirementsByType.general
  if (!businessType) return base
  const extra = requirementsByType[businessType]
  if (!extra) return base
  return [...base, ...extra]
}
