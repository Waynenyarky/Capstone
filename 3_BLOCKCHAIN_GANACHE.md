# Ganache Installation and Setup Instructions 

1. **Download Ganache**
   - Go to the official Ganache website: [https://trufflesuite.com/ganache](https://trufflesuite.com/ganache)
   - Click Download → choose Windows version

2. **Install Ganache**
   - Run the downloaded `.exe` installer
   - Follow the installer prompts → Click Next → Install → Finish

3. **Launch Ganache**
   - Start Menu → type Ganache → Enter
   - Ganache opens with a default workspace showing:
     - Accounts with balances
     - Blockchain info
     - Transaction logs

4. **Set Up a Workspace (Optional for projects)**
   - Click Quickstart Ethereum to start a default blockchain
   - Or click New Workspace to configure:
     - Workspace name
     - Number of accounts
     - Default balance
     - Gas limits

5. **Connect to Ganache**
   - Use the RPC Server URL displayed in Ganache (default: `http://127.0.0.1:7545`) in your blockchain application or Truffle/Hardhat projects