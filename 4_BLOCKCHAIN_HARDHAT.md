# Hardhat Project Setup (for Smart Contract)

**Step-by-Step Setup**

**Step 1** – Install Node.js
- Ensure Node.js is installed (Download from [nodejs.org](https://nodejs.org/)).
- Verify: `node -v`

**Step 2** – Create Hardhat Project Folder
```bash
mkdir hardhat_smart_contract
cd hardhat_smart_contract
```

**Step 3** – Initialize Node.js Project
```bash
npm init -y
```

**Step 4** – Install Hardhat & Dependencies
```bash
npm install --save-dev hardhat
npm install --save-dev @nomicfoundation/hardhat-toolbox dotenv
```

**Step 5** – Create Hardhat Project
- Run:
  ```bash
  npx hardhat
  ```
- Select: **Create a JavaScript project**
- Root: Press Enter (default)
- Add .gitignore: **Yes** (Important!)

**Step 6** – Configure Security (.env)
- **NEVER** hardcode your private key in `hardhat.config.js`.
- Create a file named `.env` in the root folder (use `.env.example` as template):
  ```env
  GANACHE_URL=http://127.0.0.1:7545
  GANACHE_PRIVATE_KEY=0x... (Private Key from Ganache Account #0)
  SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID  (or Alchemy HTTPS URL)
  SEPOLIA_PRIVATE_KEY=0x... (Metamask private key for your Sepolia account)
  CONTRACT_ADDRESS=0x... (Filled after deployment)
  ```
- How to get `SEPOLIA_RPC_URL`:
  - Infura: create project → Ethereum → select Sepolia → copy HTTPS URL
  - Alchemy: create app → Ethereum Sepolia → copy HTTPS URL

**Step 7** – Configure `hardhat.config.js`
- Open `hardhat.config.js` and add networks:
  ```js
  import "@nomicfoundation/hardhat-toolbox";
  import "dotenv/config";

  export default {
    solidity: "0.8.28",
    networks: {
      ganache: {
        url: process.env.GANACHE_URL || "http://127.0.0.1:7545",
        accounts: process.env.GANACHE_PRIVATE_KEY ? [process.env.GANACHE_PRIVATE_KEY] : [],
      },
      sepolia: {
        url: process.env.SEPOLIA_RPC_URL || "",
        accounts: process.env.SEPOLIA_PRIVATE_KEY ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
      }
    },
  };
  ```

**Step 8** – Compile & Deploy
- **Compile Contracts:**
  ```bash
  npm run compile
  ```
- **Deploy to Ganache:**
  ```bash
  npm run deploy:ganache
  ```
- **Deploy to Sepolia (requires funded account & RPC URL):**
  ```bash
  npm run deploy:sepolia
  ```
- After deployment, copy the printed contract address into `CONTRACT_ADDRESS` in `.env` to use interaction scripts:
  ```bash
  npm run interact:ganache
  # or
  npm run interact:sepolia
  ```
