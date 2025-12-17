# Ganache Installation and Setup Instructions

## What is Ganache?
Ganache is a personal blockchain for Ethereum development. It allows you to deploy contracts, develop applications, and run tests on a local blockchain.

1. **Download Ganache**
   - Go to the official Ganache website: [https://trufflesuite.com/ganache](https://trufflesuite.com/ganache)
   - Click Download → choose Windows version

2. **Install Ganache**
   - Run the downloaded `.exe` installer
   - Follow the installer prompts → Click Next → Install → Finish

3. **Launch Ganache**
   - Start Menu → type Ganache → Enter
   - You will see two options: **Quickstart** and **New Workspace**.

4. **Choose Your Workspace Mode**
   - **Quickstart (Ethereum):**
     - Good for temporary testing.
     - **WARNING:** Blockchain data is lost when you close Ganache.
   - **New Workspace (Recommended for Projects):**
     - Allows you to save your blockchain state (accounts, transactions, contracts).
     - Click **New Workspace** → Enter a name (e.g., "CapstoneProject").
     - **Add Project:** Click "Add Project" and select your `truffle-config.js` or `hardhat.config.js` (if you have one) to decode transactions properly.
     - Click **Save Workspace**.

5. **Connect Your Application**
   - **RPC Server:** Usually `http://127.0.0.1:7545` (Check the top bar in Ganache).
   - **Network ID:** Usually `5777`.
   - **Chain ID:** Usually `1337`.
   - Update your project's configuration file (e.g., `.env` or config file) with these values.

6. **Monitor Transactions**
   - **Accounts Tab:** See balances and addresses.
   - **Blocks Tab:** See mined blocks.
   - **Transactions Tab:** See transaction history.
   - **Contracts Tab:** See storage and state of your contracts (requires linking config file).
