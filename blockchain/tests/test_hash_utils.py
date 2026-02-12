"""Unit tests for hash computation and verification (no blockchain required)."""
import hashlib


def sha256_hash(data: str) -> bytes:
    """Compute SHA256 hash of string, return 32-byte digest."""
    return hashlib.sha256(data.encode()).digest()


def test_sha256_produces_32_bytes():
    """SHA256 produces 32-byte digest."""
    h = sha256_hash('permit_application_submitted_2024')
    assert len(h) == 32


def test_same_input_same_hash():
    """Same input produces same hash."""
    data = 'permit_application_submitted_2024'
    assert sha256_hash(data) == sha256_hash(data)


def test_different_input_different_hash():
    """Different input produces different hash (tamper detection)."""
    original = sha256_hash('permit_application_submitted_2024')
    tampered = sha256_hash('permit_application_submitted_2024_TAMPERED')
    assert original != tampered


def test_hash_hex_conversion():
    """Hash can be converted to/from hex for storage."""
    data = 'test_event_123'
    h = sha256_hash(data)
    hex_str = h.hex()
    restored = bytes.fromhex(hex_str)
    assert restored == h


def test_verify_hash_ui_logic_valid_length():
    """verify_hash_ui accepts 32-byte hex string."""
    # Simulates verify_hash_ui validation logic
    def validate_hash_input(hash_hex):
        try:
            h = bytes.fromhex(hash_hex.replace('0x', ''))
            if len(h) != 32:
                return 'Invalid hash length (expected 32 bytes)'
            return 'OK'
        except Exception as e:
            return str(e)

    valid_hex = sha256_hash('test').hex()
    assert validate_hash_input(valid_hex) == 'OK'


def test_verify_hash_ui_rejects_short_hex():
    """verify_hash_ui rejects hex that decodes to < 32 bytes."""
    def validate_hash_input(hash_hex):
        try:
            h = bytes.fromhex(hash_hex.replace('0x', ''))
            if len(h) != 32:
                return 'Invalid hash length (expected 32 bytes)'
            return 'OK'
        except Exception as e:
            return str(e)

    assert 'Invalid hash length' in validate_hash_input('0' * 32)
    assert 'Invalid hash length' in validate_hash_input('deadbeef')
