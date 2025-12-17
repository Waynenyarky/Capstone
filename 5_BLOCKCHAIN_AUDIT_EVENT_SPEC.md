**Audit Event JSON Schema and Canonical SHA-256 Hashing Rules**

1. **Define Audit Event Schema**
    - Required fields: event_id, event_type, actor_id, actor_role, entity_type, entity_id, action, timestamp
    - Optional field: metadata (JSON object)
    - Timestamp must be ISO-8601 UTC format

2. **Normalize JSON (Canonicalization)**
    - Encode JSON in UTF-8 (no BOM)
    - Sort all keys alphabetically (recursive)
    - Minify JSON (no spaces, tabs, or newlines)
    - Strings in double quotes, no trailing spaces
    - Omit fields with null values
    - Numbers in plain format (no scientific notation)

3. **Compute SHA-256 Hash**
    - Validate JSON against schema
    - Normalize JSON using canonical rules
    - Convert to UTF-8 string
    - Compute SHA-256 hash
    - Output as lowercase hexadecimal string

4. **Example: Canonical JSON:**
{"action":"create","actor_id":"user_123","actor_role":"client","entity_id":"appt_456","entity_type":"appointment","event_id":"evt_001","event_type":"APPOINTMENT_CREATED","metadata":{"pet_type":"dog","service":"grooming"},"timestamp":"2025-12-16T10:30:00Z"}
    - SHA-256 Hash: computed programmatically

5. **Usage Across Systems**
    - **Mobile App:** generate events and hashes
    - **Backend API:** verify and store hashes
    - **Blockchain:** store hashes for immutability
    - **Auditing:** recompute hashes to detect tampering

6. **AuditAnchor Smart Contract**
**Purpose:** Anchors audit event hashes on-chain for immutability and verification.

7. **Hardhat Scripts**
    - Compile: npx hardhat run scripts/compile.js
    - Deploy:

Ganache: npx hardhat run scripts/deploy.js --network localhost

Sepolia: npx hardhat run scripts/deploy.js --network sepolia

8. **Benefits**
    - Cross-platform consistency
    - Deterministic, tamper-evident logs
    - Blockchain-ready audit trail
    - Simplifies verification: auditors can confirm the authenticity of events without exposing sensitive data

8. **Additional Notes**
    - Metadata can include optional details like service type, user role, or location
    - SHA-256 ensures cryptographic security and collision resistance
    - Off-chain systems can reconstruct events from canonical JSON for full audit history