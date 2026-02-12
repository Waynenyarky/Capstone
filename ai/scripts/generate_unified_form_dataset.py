#!/usr/bin/env python3
"""
Generate synthetic unified form validation dataset for the AI Document Validation prototype.
Aligned with:
- BPLO forms from Alaminos City (pre-reqs a-g, application form fields)
- TAX CODE + LINE OF BUSINESS cascading structure (see docs/alaminos_tax_code_structure.md)
  - Alaminos uses tax codes (letters, e.g. C, D, C-D) NOT PSIC - line of business depends on tax code
  - This script uses a PLACEHOLDER taxonomy until Alaminos BPLO provides the actual list
- Industry-specific NGA license requirements (FDA, DENR, BSP, DOH, etc.)
- Realistic capital/gross_sales ranges per business type (fees based on these per LGC)

~60% valid, ~40% with errors (missing pre-reqs, wrong tax code, invalid address, inconsistent data).
"""
import csv
import random
from pathlib import Path

# TAX CODE (placeholder - Alaminos uses LGU-specific codes like C, D, C-D; get real list from BPLO)
# Structure: tax_code -> [line_of_business options] -> detailed_line describes what they sell
# Per user: officer selects tax code first, then line of business (cascading), so wrong combo is impossible in-system
TAX_CODES = {
    'A': ('Agriculture, forestry, fishing', ['Farming', 'Fishing', 'Forestry', 'Livestock']),
    'B': ('Mining, quarrying', ['Mining', 'Quarrying']),
    'C': ('Manufacturing', ['Food manufacturing', 'Textile', 'Wood products', 'Metal products', 'Other manufacturing']),
    'C-D': ('Manufacturing and utilities', ['Mixed manufacturing', 'Processing']),  # Combined code per user
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

# Map tax_code -> (capital_range_key, nga_required)
# NGA required: B=mining, C/C-D=manufacturing, D=energy, I=food, K=financial, H=transport
TAX_CODE_META = {
    'A': ('a', False), 'B': ('b', True), 'C': ('c', True), 'C-D': ('c', True), 'D': ('d', True),
    'E': ('e', False), 'F': ('f', False), 'G': ('g', False), 'H': ('h', True), 'I': ('i', True),
    'J': ('j', False), 'K': ('k', True), 'L': ('l', False), 'M': ('m', False), 'N': ('n', False),
    'S': ('s', False),
}
CAPITAL_RANGES = {
    'a': (50_000, 2_000_000), 'b': (5_000_000, 100_000_000), 'c': (500_000, 50_000_000),
    'd': (10_000_000, 200_000_000), 'e': (1_000_000, 20_000_000), 'f': (500_000, 30_000_000),
    'g': (50_000, 10_000_000), 'h': (200_000, 15_000_000), 'i': (100_000, 5_000_000),
    'j': (100_000, 20_000_000), 'k': (1_000_000, 100_000_000), 'l': (500_000, 50_000_000),
    'm': (50_000, 10_000_000), 'n': (100_000, 15_000_000), 's': (50_000, 5_000_000),
}

# Gross sales typically 1.5-5x capital for ongoing businesses
GROSS_SALES_MULTIPLIER = (1.2, 4.0)

# Alaminos City, Pangasinan barangays
BARANGAYS = [
    'Poblacion', 'Lucap', 'Bolaney', 'Bued', 'Cayucay', 'Amangbangan', 'San Jose', 'Pogo',
    'Pandan', 'Baleyadaan', 'Balangobong', 'Landoc', 'Linmansangan', 'San Antonio', 'San Roque',
    'San Vicente', 'Santa Maria', 'Victoria', 'Alos', 'Amandiego', 'Bisocol', 'Cabatuan',
    'Dulacac', 'Inerangan', 'Maawi', 'Macatiw', 'Magsaysay', 'Mona', 'Palamis', 'Pangapisan',
    'Pocalpocal', 'Polo', 'Quibuar', 'Sabangan', 'Tanaytay', 'Tawintawin', 'Telbang', 'Tangcarang',
]

# Common Filipino surnames and first names
SURNAMES = ['Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Ramos', 'Mendoza', 'Cruz', 'Aquino', 'Gonzalez', 'Villanueva',
            'Fernandez', 'Ramos', 'Torres', 'Flores', 'Rivera', 'Gomez', 'Diaz', 'Moreno', 'Castillo', 'Lopez']
FIRST_NAMES = ['Maria', 'Juan', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Elena', 'Manuel', 'Carmen',
               'Antonio', 'Teresa', 'Francisco', 'Lourdes', 'Ricardo', 'Rita', 'Fernando', 'Sofia', 'Roberto', 'Angela']

STREETS = ['Quezon Ave', 'Rizal St', 'MacArthur Ave', 'Burgos St', 'Luna St', 'Gomez St', 'Magsaysay Ave', 'Bonifacio St']

ORG_TYPES = ['Single', 'Partnership', 'Corporation', 'Cooperative']
APP_TYPES = ['New', 'Renewal', 'Additional']


def generate_valid_row(idx):
    app_type = random.choice(APP_TYPES)
    tax_code = random.choice(list(TAX_CODES.keys()))
    section_label, lob_options = TAX_CODES[tax_code]
    line_of_business = random.choice(lob_options)
    detailed_line = line_of_business  # what they sell; cascading ensures this matches
    cap_key, nga_required = TAX_CODE_META.get(tax_code, ('g', False))

    lo, hi = CAPITAL_RANGES[cap_key]
    capital = random.randint(lo, hi)
    gross_mult = random.uniform(*GROSS_SALES_MULTIPLIER)
    gross_sales = int(capital * gross_mult) if app_type == 'Renewal' else (random.randint(lo, hi) if app_type == 'New' else '')
    org_type = random.choice(ORG_TYPES)
    is_lessee = random.random() < 0.4
    last = random.choice(SURNAMES)
    first = random.choice(FIRST_NAMES)
    return {
        'id': idx,
        'application_type': app_type,
        'org_type': org_type,
        'business_plate_no': f'BP-2024-{idx:04d}' if app_type == 'Renewal' else '',
        'year_established': random.randint(2018, 2024) if app_type == 'New' else '',
        'last_name': last,
        'first_name': first,
        'middle_name': random.choice(['M.', 'B.', 'C.', 'D.', 'S.']),
        'business_name': f'{first} {last} {random.choice(["Sari-Sari", "Trading", "Services", "Enterprises", "Corp"])}',
        'trade_name': f'Trade {idx}',
        'house_bldg_no': f'{random.randint(1, 999)}',
        'street': random.choice(STREETS),
        'barangay': random.choice(BARANGAYS),
        'city': 'Alaminos City',
        'contact_no': f'09{random.randint(17, 19)}{random.randint(10000000, 99999999)}',
        'email': f'{first.lower().replace(" ", "")}{idx}@example.com',
        'business_area_sqm': random.randint(10, 500),
        'total_employees': random.randint(1, 50),
        'is_lessee': 1 if is_lessee else 0,
        'lessor_name': f'{random.choice(SURNAMES)}' if is_lessee else '',
        'monthly_rental': random.randint(5000, 50000) if is_lessee else '',
        'tax_code': tax_code,
        'line_of_business': line_of_business,
        'detailed_line': detailed_line,
        'capitalization': capital,
        'gross_sales': gross_sales if app_type == 'Renewal' else (random.randint(lo, hi) if app_type == 'New' and random.random() < 0.5 else ''),
        'ctc_provided': 1,
        'barangay_clearance_provided': 1,
        'pis_enrolled': 1,
        'lease_or_permit_provided': 1,
        'spa_provided': 1,
        'nga_license_provided': 1 if nga_required else 1,
        'dti_sec_provided': 1,
        'is_valid': 1,
        'missing_field': 0,
        'wrong_tax_code': 0,
        'invalid_address': 0,
        'inconsistent_data': 0,
        'missing_prereq': 0,
    }


def generate_invalid_row(idx, error_type):
    row = generate_valid_row(idx)
    row['is_valid'] = 0
    if error_type == 'missing_field':
        row['last_name'] = ''
        row['first_name'] = ''
        row['missing_field'] = 1
    elif error_type == 'missing_prereq':
        row['ctc_provided'] = 0
        row['barangay_clearance_provided'] = 0
        row['missing_prereq'] = 1
    elif error_type == 'wrong_tax_code':
        row['tax_code'] = 'X'
        row['line_of_business'] = 'Invalid'
        row['wrong_tax_code'] = 1
    elif error_type == 'invalid_address':
        row['house_bldg_no'] = ''
        row['street'] = ''
        row['barangay'] = ''
        row['invalid_address'] = 1
    elif error_type == 'inconsistent_data':
        row['tax_code'] = 'G'
        row['line_of_business'] = 'Mining'
        row['inconsistent_data'] = 1
    elif error_type == 'missing_nga':
        nga_codes = [tc for tc, (_, req) in TAX_CODE_META.items() if req]
        tax_code = random.choice(nga_codes)
        _, lob_opts = TAX_CODES[tax_code]
        row['tax_code'] = tax_code
        row['line_of_business'] = random.choice(lob_opts)
        row['detailed_line'] = row['line_of_business']
        row['nga_license_provided'] = 0
        row['missing_prereq'] = 1
    elif error_type == 'missing_lease':
        row['is_lessee'] = 1
        row['lease_or_permit_provided'] = 0
        row['missing_prereq'] = 1
    elif error_type == 'invalid_capital':
        row['capitalization'] = -1000
        row['inconsistent_data'] = 1
    return row


def main():
    random.seed(42)
    rows = []
    idx = 1
    num_valid = 600
    num_invalid = 400
    for _ in range(num_valid):
        rows.append(generate_valid_row(idx))
        idx += 1
    error_types = ['missing_field', 'missing_prereq', 'wrong_tax_code', 'invalid_address', 'inconsistent_data',
                   'missing_nga', 'missing_lease', 'invalid_capital']
    for _ in range(num_invalid):
        et = random.choice(error_types)
        rows.append(generate_invalid_row(idx, et))
        idx += 1
    random.shuffle(rows)
    out_path = Path(__file__).parent.parent / 'datasets' / 'unified_form_validation_dataset.csv'
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = list(rows[0].keys())
    with open(out_path, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    print(f'Wrote {len(rows)} rows to {out_path}')
    print('Tax code + line of business (cascading), NGA reqs, Alaminos barangays. See docs/alaminos_tax_code_structure.md')


if __name__ == '__main__':
    main()
