"""
Integration tests - call contract via Web3.
Skip if Ganache not running or contracts not deployed.
"""
import json
import pytest
from pathlib import Path

RPC_URL = 'http://127.0.0.1:7545'
BUILD_DIR = Path(__file__).parent.parent / 'build' / 'contracts'


def _load_audit_log():
    """Load AuditLog contract. Returns None if not deployed."""
    try:
        from web3 import Web3
        w3 = Web3(Web3.HTTPProvider(RPC_URL))
        if not w3.is_connected():
            return None, None
        with open(BUILD_DIR / 'AuditLog.json') as f:
            data = json.load(f)
        addr = next((n.get('address') for n in data.get('networks', {}).values() if n.get('address')), None)
        if not addr:
            return None, None
        contract = w3.eth.contract(address=Web3.to_checksum_address(addr), abi=data['abi'])
        return w3, contract
    except Exception:
        return None, None


@pytest.fixture
def audit_contract():
    w3, contract = _load_audit_log()
    return w3, contract


@pytest.mark.skipif(
    _load_audit_log()[1] is None,
    reason='Ganache not running or contracts not deployed (docker-compose up -d ganache, then deploy)'
)
def test_hash_exists_returns_false_for_unknown_hash(audit_contract):
    """hashExists returns False for hash that was never logged."""
    w3, audit_log = audit_contract
    import hashlib
    unknown_data = 'never_logged_hash_xyz_123'
    h = hashlib.sha256(unknown_data.encode()).digest()
    exists = audit_log.functions.hashExists(h).call()
    assert exists is False


def test_tampered_data_produces_different_hash():
    """Tampered data produces different hash (conceptual - no chain needed)."""
    import hashlib
    original = hashlib.sha256(b'permit_2024').hexdigest()
    tampered = hashlib.sha256(b'permit_2024_TAMPERED').hexdigest()
    assert original != tampered
