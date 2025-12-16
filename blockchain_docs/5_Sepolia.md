**Sepolia Verification Instructions**

**Step 1** – Create an Ethereum Wallet
- Install MetaMask
- Create or import a wallet
- Copy your wallet address
- Export the private key (without 0x) for Hardhat use

**Step 2** - Add Sepolia Network to MetaMask

**Step 3** - Get Sepolia Test ETH
- Go to a Sepolia faucet
- Paste your wallet address
- Request test ETH
- Confirm balance appears in MetaMask

**Step 4** - Create Environment Variables
- Create a .env file in the Hardhat root folder

**Step 5** - Configure Sepolia Network in Hardhat
- Open hardhat.config.js
- Add the Sepolia network

**Step 6** - Deploy Smart Contract to Sepolia

**Step 7** - Check Deployment on Block Explorer
- Open Sepolia Etherscan
- Paste the deployed contract address
- Confirm: contract address exists, at least one transaction is visible

**Step 8** - Verify Smart Contract on Sepolia
- Add Etherscan API key to .env
- Confirm contract source code is verified on Sepolia Etherscan

**Troubleshooting Instructions**

**Issue 1** - Insufficient Balance
**Fix** - Make sure MetaMask is on Sepolia
        - Request Sepolia test ETH from a faucet
        - Request Sepolia test ETH from a faucet

**Issue 2** - Invalid Private Key
**Fix** - Remove 0x from private key
        - No quotes or spaces in .env

**Issue 3** - Mainnet Balance Error
**Fix** - Ensure --network sepolia is used
        - Confirm Chain ID is 11155111

**Issue 4** - Confirm Chain ID is 11155111
**Fix** - Wait for cooldown
        - Use another Sepolia faucet

**Issue 5** - Contract Not Visible on Etherscan
**Fix** - Switch Etherscan network to Sepolia
        - Refresh after 1–2 minutes
        - Recheck deployed address


