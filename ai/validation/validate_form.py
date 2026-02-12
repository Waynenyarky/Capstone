"""
BPLO form validation logic - extracted for reuse in notebook and tests.
Validates tax code, line of business, pre-requirements (a-g).
Includes input sanitization to prevent injection and abuse.
"""
import re
import html as _html

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Tax code -> (section label, [line_of_business options])
# Alaminos uses LGU-specific codes (not PSIC). Placeholder until official list.
TAX_CODES = {
    'A': ('Agriculture, forestry, fishing', ['Farming', 'Fishing', 'Forestry', 'Livestock']),
    'B': ('Mining, quarrying', ['Mining', 'Quarrying']),
    'C': ('Manufacturing', ['Food manufacturing', 'Textile', 'Wood products', 'Metal products', 'Other manufacturing']),
    'C-D': ('Manufacturing and utilities', ['Mixed manufacturing', 'Processing']),
    'D': ('Electricity, gas, steam', ['Power supply', 'Gas distribution']),
    'E': ('Water, waste management', ['Water supply', 'Waste management']),
    'F': ('Construction', ['Building construction', 'Civil engineering', 'Specialty trade']),
    'G': ('Wholesale, retail trade', ['Wholesale', 'Retail', 'Motor vehicle repair']),
    'H': ('Transport, storage', ['Passenger transport', 'Freight', 'Storage']),
    'I': ('Accommodation, food service', ['Restaurants', 'Hotels', 'Food catering']),
    'J': ('Information, communication', ['IT services', 'Telecommunications']),
    'K': ('Financial, insurance', ['Banking', 'Insurance', 'Lending']),
    'L': ('Real estate', ['Real estate development', 'Real estate brokerage']),
    'M': ('Professional services', ['Legal', 'Accounting', 'Engineering', 'Consulting']),
    'N': ('Admin, support services', ['Manpower', 'Security', 'Business support']),
    'S': ('Other services', ['Repair', 'Personal care', 'Laundry', 'Funeral']),
}

VALID_TAX_CODES = list(TAX_CODES.keys())

# All valid lines of business (flat list for quick lookup)
ALL_LINES_OF_BUSINESS = []
for _label, _lobs in TAX_CODES.values():
    ALL_LINES_OF_BUSINESS.extend(_lobs)
ALL_LINES_OF_BUSINESS = list(set(ALL_LINES_OF_BUSINESS))

# Alaminos City barangays
BARANGAYS = [
    'Poblacion', 'Lucap', 'Bolaney', 'Bued', 'Cayucay', 'Amangbangan', 'San Jose', 'Pogo',
    'Pandan', 'Baleyadaan', 'Balangobong', 'Landoc', 'Linmansangan', 'San Antonio', 'San Roque',
    'San Vicente', 'Santa Maria', 'Victoria', 'Alos', 'Amandiego', 'Bisocol', 'Cabatuan',
    'Dulacac', 'Inerangan', 'Maawi', 'Macatiw', 'Magsaysay', 'Mona', 'Palamis', 'Pangapisan',
    'Pocalpocal', 'Polo', 'Quibuar', 'Sabangan', 'Tanaytay', 'Tawintawin', 'Telbang', 'Tangcarang',
]

# ---------------------------------------------------------------------------
# Input sanitization
# ---------------------------------------------------------------------------
MAX_TEXT_LENGTH = 200
MAX_CODE_LENGTH = 10
_HTML_TAG_RE = re.compile(r'<[^>]+>')


def sanitize(value, max_len=MAX_TEXT_LENGTH):
    """Strip HTML tags, escape entities, and enforce max length."""
    if value is None:
        return ''
    s = str(value).strip()
    # Remove HTML tags
    s = _HTML_TAG_RE.sub('', s)
    # Unescape then re-escape HTML entities to neutralize injection
    s = _html.escape(_html.unescape(s))
    # Truncate
    return s[:max_len]


def sanitize_code(value):
    """Sanitize a short code field (tax code, etc.)."""
    return sanitize(value, max_len=MAX_CODE_LENGTH)


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def validate_form(
    business_name, last_name, first_name, barangay, city, tax_code, line_of_business,
    ctc, barangay_clearance, pis, dti_sec
):
    """Validate BPLO form fields. Returns 'VALID - All checks passed' or 'INVALID: ...'."""
    # Sanitize all text inputs
    business_name = sanitize(business_name)
    last_name = sanitize(last_name)
    first_name = sanitize(first_name)
    barangay = sanitize(barangay)
    city = sanitize(city)
    tax_code = sanitize_code(tax_code)
    line_of_business = sanitize(line_of_business)

    errors = []

    # Required fields
    if not business_name or not last_name or not first_name:
        errors.append('Missing taxpayer/owner name')
    if not barangay or not city:
        errors.append('Address required (barangay, city)')

    # Tax code validation
    tc_upper = tax_code.strip().upper() if tax_code else ''
    if tc_upper and tc_upper not in VALID_TAX_CODES:
        errors.append(f'Invalid tax code: {tc_upper}')

    # Tax code / line of business consistency
    if tc_upper and tc_upper in TAX_CODES and line_of_business:
        _, valid_lobs = TAX_CODES[tc_upper]
        if line_of_business not in valid_lobs:
            errors.append(f'Line of business "{line_of_business}" does not match tax code {tc_upper}')

    # Pre-requirements
    if not ctc:
        errors.append('CTC required (pre-req a)')
    if not barangay_clearance:
        errors.append('Barangay Clearance required (pre-req b)')
    if not pis:
        errors.append('PIS enrollment required (pre-req c)')
    if not dti_sec:
        errors.append('DTI/SEC registration required (pre-req g)')

    if errors:
        return f'INVALID:\n' + '\n'.join(f'  - {e}' for e in errors)
    return 'VALID - All checks passed'
