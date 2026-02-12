# Alaminos City BPLO: Tax Code & Line of Business Structure

## What You Observed

From the field visit, the Alaminos BPLO system uses a **cascading dropdown** structure:

1. **Tax Code** (first dropdown) – Letter codes, e.g. `C`, `D`, or combined formats like `C-D`
2. **Line of Business** (second dropdown) – Options depend on the selected tax code
3. **Detailed Line of Business** (third dropdown) – More specific options under the line of business

Important points:
- The officer selects the tax code first, then line of business, then detailed line.
- Because of this cascading flow, **the officer cannot choose a wrong tax code together with a mismatched line of business** – the second dropdown only shows options valid for the selected tax code.
- This is **not** the same as PSIC 2019 (Philippine Standard Industrial Classification). PSIC uses single letters `a–u` for sections; the Alaminos system uses letter codes that can include combinations like `C-D`.
- The line of business describes **what the business sells or does**.

## What We Could Not Find Online

Exact tax code lists for Alaminos City are not publicly available. Public sources show:

- **PSIC 2019**: Sections A–U (Agriculture through Extraterritorial), used by BIR and some LGUs.
- **LGC Section 143**: Legal categories (manufacturers, wholesalers, retailers, contractors, banks, etc.) – not letter codes.
- **LGU-specific codes**: Many LGUs have their own tax codes in local revenue ordinances.
- **iBPLS**: DICT’s system; the exact code sets may be configured per LGU.

## Recommendation

**Obtain the taxonomy from Alaminos BPLO:**

1. **BPLO officer (e.g. Wilfredo Villena)** – Ask for:
   - Full list of tax codes (with descriptions)
   - For each tax code, the list of line of business options
   - For each line of business, the list of detailed line options (if applicable)

2. **System export** – If they use iBPLS or another software, request:
   - Export of the tax code master list
   - Export of the line-of-business tree (code → line → detailed line)

3. **Local revenue ordinance** – Check Alaminos City’s revenue/tax ordinance for business classifications and codes.

## Impact on BizClear

- **Dataset**: The AI dataset should use this tax_code → line_of_business → detailed_line structure instead of PSIC.
- **Validation**: Because of cascading dropdowns, “wrong tax code + wrong line of business” is unlikely in practice. Validation should focus on:
  - Missing selections
  - Invalid or obsolete codes
  - Consistency with other application data (e.g. business description)
- **Placeholder**: Until the real taxonomy is available, we use a simplified structure that can be replaced once the official codes are provided.
