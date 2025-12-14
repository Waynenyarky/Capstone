# Blockchain Audit System Documentation

## Overview
This module implements a simple blockchain-based audit system using both:
- Python + Jupyter Notebook (for algorithm demonstration and data generation)
- Node.js (for mining, validation, and exporting an audit report)

It records audit logs of user actions and ensures data integrity and tamper detection using SHA256 hashes.

---

## Structure

### Block
- Each block stores:
  - `index` → Position in the blockchain
  - `timestamp` → Time of creation
  - `data` → Audit log (e.g., user and action)
  - `previous_hash` → Hash of the previous block
  - `hash` → SHA256 hash of the current block

### Blockchain
- The blockchain is a list of linked blocks.
- The first block is the Genesis Block (`index=0`) which initializes the system.
- Each new block is added using `add_block(data)` (Python) or by constructing a `Block` and calling `addBlock` (Node).

---

## Features

1. **Audit Logging**
   - Records actions such as `Login`, `Update Record`, `Delete Record` or any custom payload.

2. **Integrity Verification**
   - `is_chain_valid()` checks:
     - If each block’s hash matches its calculated hash.
     - If the `previous_hash` matches the hash of the previous block.
   - Detects tampering automatically.

3. **Persistence**
   - The canonical chain file is saved at `blockchain/data/blockchain.json`.
   - Loading the blockchain from file allows continuity across sessions and cross-language workflows.

4. **Audit Export (Node)**
   - Running the Node script exports a validation report to `blockchain/data/audit.json`.

---

## Current Audit Logs (example from the notebook)
- Index 0: Genesis Block
- Index 1: {'user': 'Pen', 'action': 'Login'}
- Index 2: {'user': 'Wayne', 'action': 'Update Record'}
- Index 3: {'user': 'Keith', 'action': 'Delete Record'}

---

## Example Usage

### Jupyter Notebook (Python)
The notebook lives at `anaconda_projects/notebooks/BlockchainAudit.ipynb` and writes to `../blockchain/data/blockchain.json`.

```python
# Initialize blockchain
audit_chain = Blockchain()

# Add audit logs
audit_chain.add_block({"user": "Pen", "action": "Login"})
audit_chain.add_block({"user": "Wayne", "action": "Update Record"})
audit_chain.add_block({"user": "Keith", "action": "Delete Record"})

# Display blockchain
for block in audit_chain.chain:
    print(block.index, block.data, block.hash)

# Check validity
print(audit_chain.is_chain_valid())
```

### Node.js (CLI)
From the `blockchain/` directory:
```bash
npm install
node main.js
```
This mines example blocks, checks validity before/after tampering, and writes `blockchain/data/audit.json`.

---

## Notes
- Genesis Block should never be modified.
- New blocks are always appended; old blocks should remain intact.
- The notebook demonstrates the concept (professor requirement), while the Node script provides an easily automatable audit export.
