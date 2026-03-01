const FEE_TAXONOMY = [
  { taxCode: 'RET', label: 'Retail', charterRef: 'Section 2A.01', psicCodes: ['g'] },
  { taxCode: 'WHL', label: 'Wholesale', charterRef: 'Section 2B.01', psicCodes: ['g'] },
  { taxCode: 'FDS', label: 'Food Service', charterRef: 'Section 2C.01', psicCodes: ['i'] },
  { taxCode: 'MFG', label: 'Manufacturing', charterRef: 'Section 3B.03', psicCodes: ['c'] },
  { taxCode: 'SVC', label: 'Services', charterRef: 'Section 2D.01', psicCodes: ['j','k','l','m','n','p','q','r','s'] },
  { taxCode: 'FIN', label: 'Financial', charterRef: 'Section 2E.01', psicCodes: ['k'] },
  { taxCode: 'REL', label: 'Real Estate', charterRef: 'Section 2F.01', psicCodes: ['l'] },
  { taxCode: 'TRN', label: 'Transportation', charterRef: 'Section 3A.01', psicCodes: ['h'] },
  { taxCode: 'AGR', label: 'Agriculture', charterRef: 'Section 3C.01', psicCodes: ['a','b'] },
  { taxCode: 'CON', label: 'Construction', charterRef: 'Section 3D.01', psicCodes: ['f'] },
  { taxCode: 'MIN', label: 'Mining', charterRef: 'Section 3E.01', psicCodes: ['b'] },
  { taxCode: 'UTL', label: 'Utilities', charterRef: 'Section 3F.01', psicCodes: ['d','e'] },
]

module.exports = FEE_TAXONOMY
