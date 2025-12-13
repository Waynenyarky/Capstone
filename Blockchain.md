# Blockchain Audit System Documentation

## Overview
This project implements a blockchain-based audit system using Python and Jupyter Notebook.
It records audit logs of user actions and ensures data integrity and tamper detection using SHA256 hashes.

---

## Structure

### Block
- Each block stores:
  - `index` → Position in the blockchain
  - `timestamp` → Time of creation
  - `data` → Audit log (user and action)
  - `previous_hash` → Hash of the previous block
  - `hash` → SHA256 hash of the current block

### Blockchain
- The blockchain is a list of linked blocks.
- The first block is the Genesis Block (`index=0`) which initializes the system.
- Each new block is added using `add_block(data)`.

---

## Features

1. **Audit Logging**
   - Records actions such as `Login`, `Update Record`, `Delete Record`.
   - Each action is linked to a user.

2. **Integrity Verification**
   - The method `is_chain_valid()` checks:
     - If each block’s hash matches its calculated hash.
     - If the `previous_hash` matches the hash of the previous block.
   - Detects tampering automatically.

3. **Persistence**
   - Blockchain is saved in `blockchain.json` in the root folder.
   - Loading the blockchain from file allows continuity across sessions.

---

## Current Audit Logs
- Index 0: Genesis Block
- Index 1: {'user': 'Pen', 'action': 'Login'}
- Index 2: {'user': 'Wayne', 'action': 'Update Record'}
- Index 3: {'user': 'Keith', 'action': 'Delete Record'}


---

## Example Usage

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

---

## Notes
- Genesis Block should never be modified.
- New blocks are always appended; old blocks should remain intact.
- This system is suitable for audit tracking in applications like login logs, data updates, and record deletions.
