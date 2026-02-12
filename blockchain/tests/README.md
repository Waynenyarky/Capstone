# Blockchain Audit Prototype - Tests

## Python tests (hash utils, integration)

From project root:

```bash
pip install pytest web3
pytest blockchain/tests/ -v
```

| File | Description |
|------|-------------|
| `test_hash_utils.py` | SHA256 hash computation, tamper detection, verify_hash_ui logic |
| `test_integration.py` | Contract hashExists (skips if Ganache not running) |

## Truffle contract tests

Requires Ganache:

```bash
docker-compose up -d ganache
cd blockchain && npm run migrate:ganache
npm test
```

Tests `hashExists` returns False for unknown hash, True for logged hash; duplicate rejection; etc.
