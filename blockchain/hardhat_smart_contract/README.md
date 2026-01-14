# Blockchain Audit Logging - Smart Contracts

This directory contains the Ethereum smart contracts for immutable audit logging using Hardhat and Ganache.

## Prerequisites

- Node.js (v16 or higher)
- Ganache installed and running
- npm or yarn

## Setup

### 1. Install Dependencies

```bash
cd blockchain/hardhat_smart_contract
npm install
```

### 2. Configure Ganache

1. Open Ganache (GUI or CLI)
2. Create a new workspace or use the default one
3. Note the RPC Server URL (default: `http://127.0.0.1:7545`)
4. Copy the private key of Account 0 (the first account)

### 3. Configure Environment Variables

Create a `.env` file in this directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
GANACHE_RPC_URL=http://127.0.0.1:7545
DEPLOYER_PRIVATE_KEY=your_ganache_account_0_private_key_here
```

**Important**: Get the private key from Ganache:
- In Ganache UI: Click on Account 0 → Click "Show Private Key" → Copy the key
- The private key should start with `0x`

### 4. Compile Contracts

```bash
npm run compile
```

This compiles the Solidity contracts and generates artifacts in the `artifacts/` directory.

### 5. Deploy Contracts

```bash
npm run deploy
```

This will:
- Deploy the `AuditLog` contract to Ganache
- Print the contract address
- Show deployment details

**Copy the contract address** - you'll need it for the backend configuration.

### 6. Update Backend Configuration

After deployment, add the contract address to your backend `.env`:

```env
AUDIT_CONTRACT_ADDRESS=0x...  # The address from deployment output
```

## Contract Functions

### For Off-Chain Data (Hash Storage)

- `logAuditHash(bytes32 hash, string eventType)` - Log a hash of audit data stored in MongoDB
- `verifyHash(bytes32 hash)` - Verify if a hash exists on the blockchain

### For On-Chain Data (Full Storage)

- `logCriticalEvent(string eventType, string userId, string details)` - Log full event details on-chain
- `logAdminApproval(...)` - Log admin approval events with full details

## Viewing Transactions in Ganache

1. Open Ganache UI
2. Go to the "Transactions" tab
3. You'll see all transactions including:
   - Contract deployment
   - `logAuditHash` calls
   - `logCriticalEvent` calls
   - `logAdminApproval` calls

4. Click on any transaction to see:
   - Transaction hash
   - Block number
   - Gas used
   - Event logs (emitted events)

## Testing

Run the test suite:

```bash
npm test
```

## Troubleshooting

### "Provider not connected"
- Make sure Ganache is running
- Check that `GANACHE_RPC_URL` matches Ganache's RPC URL
- Verify the URL is accessible (try opening it in a browser)

### "Insufficient funds"
- Make sure Account 0 has enough ETH (Ganache provides 100 ETH by default)
- Check that you're using the correct private key

### "Contract not found"
- Make sure you've deployed the contract
- Verify `AUDIT_CONTRACT_ADDRESS` is set correctly in backend `.env`

### "Invalid private key"
- Ensure the private key starts with `0x`
- Make sure there are no extra spaces or newlines
- Verify you copied the entire key from Ganache

## Contract Address

After deployment, the contract address will be printed. Save this address and add it to your backend `.env` file as `AUDIT_CONTRACT_ADDRESS`.

## Network Configuration

The Hardhat config is set up for:
- **Ganache**: Local development network (Chain ID: 1337)
- **Hardhat Network**: For testing (Chain ID: 1337)

To deploy to other networks (testnets, mainnet), add them to `hardhat.config.js` and update the deployment script.
