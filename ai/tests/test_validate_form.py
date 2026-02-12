"""Integration tests for validate_form (known valid/invalid inputs)."""
import pytest
from ai.validation.validate_form import validate_form


def test_valid_form_passes():
    """Complete valid form returns VALID."""
    result = validate_form(
        business_name='ABC Corp',
        last_name='Dela Cruz',
        first_name='Juan',
        barangay='Poblacion',
        city='Alaminos City',
        tax_code='G',
        line_of_business='Retail',
        ctc=True,
        barangay_clearance=True,
        pis=True,
        dti_sec=True,
    )
    assert result == 'VALID - All checks passed'


def test_missing_name_fails():
    """Missing taxpayer name returns INVALID."""
    result = validate_form(
        business_name='ABC Corp',
        last_name='',
        first_name='',
        barangay='Poblacion',
        city='Alaminos City',
        tax_code='G',
        line_of_business='Retail',
        ctc=True,
        barangay_clearance=True,
        pis=True,
        dti_sec=True,
    )
    assert result.startswith('INVALID:')
    assert 'Missing taxpayer' in result


def test_missing_address_fails():
    """Missing address returns INVALID."""
    result = validate_form(
        business_name='ABC Corp',
        last_name='Dela Cruz',
        first_name='Juan',
        barangay='',
        city='',
        tax_code='G',
        line_of_business='Retail',
        ctc=True,
        barangay_clearance=True,
        pis=True,
        dti_sec=True,
    )
    assert result.startswith('INVALID:')
    assert 'Address required' in result


def test_invalid_tax_code_fails():
    """Invalid tax code returns INVALID."""
    result = validate_form(
        business_name='ABC Corp',
        last_name='Dela Cruz',
        first_name='Juan',
        barangay='Poblacion',
        city='Alaminos City',
        tax_code='X',
        line_of_business='Retail',
        ctc=True,
        barangay_clearance=True,
        pis=True,
        dti_sec=True,
    )
    assert result.startswith('INVALID:')
    assert 'Invalid tax code' in result


def test_valid_tax_code_c_d():
    """C-D tax code is valid."""
    result = validate_form(
        business_name='ABC Corp',
        last_name='Dela Cruz',
        first_name='Juan',
        barangay='Poblacion',
        city='Alaminos City',
        tax_code='C-D',
        line_of_business='Mixed manufacturing',
        ctc=True,
        barangay_clearance=True,
        pis=True,
        dti_sec=True,
    )
    assert result == 'VALID - All checks passed'


def test_missing_ctc_fails():
    """Missing CTC returns INVALID."""
    result = validate_form(
        business_name='ABC Corp',
        last_name='Dela Cruz',
        first_name='Juan',
        barangay='Poblacion',
        city='Alaminos City',
        tax_code='G',
        line_of_business='Retail',
        ctc=False,
        barangay_clearance=True,
        pis=True,
        dti_sec=True,
    )
    assert result.startswith('INVALID:')
    assert 'CTC' in result


def test_missing_dti_sec_fails():
    """Missing DTI/SEC returns INVALID."""
    result = validate_form(
        business_name='ABC Corp',
        last_name='Dela Cruz',
        first_name='Juan',
        barangay='Poblacion',
        city='Alaminos City',
        tax_code='G',
        line_of_business='Retail',
        ctc=True,
        barangay_clearance=True,
        pis=True,
        dti_sec=False,
    )
    assert result.startswith('INVALID:')
    assert 'DTI/SEC' in result


def test_empty_tax_code_passes():
    """Empty tax_code is treated as valid (optional field)."""
    result = validate_form(
        business_name='ABC Corp',
        last_name='Dela Cruz',
        first_name='Juan',
        barangay='Poblacion',
        city='Alaminos City',
        tax_code='',
        line_of_business='Retail',
        ctc=True,
        barangay_clearance=True,
        pis=True,
        dti_sec=True,
    )
    assert result == 'VALID - All checks passed'
