# Hardhat Project Setup (for Smart Contract)


**Step-by-Step Setup**

**Step 1** – Install Node.js


**Step 2** – Create Hardhat Project Folder


**Step 3** – Initialize Node.js Project


**Step 4** – Install Hardhat

- Run npx hardhat and select “Create a JavaScript project”

- Accept all default settings

- Project structure is created: contracts/, scripts/, test/, hardhat.config.js

**Step 5** – Install Hardhat Toolbox

- Install plugins for testing and deployment: npm install --save-dev @nomicfoundation/hardhat-toolbox

**Step 6** – Configure Development Network

- Open hardhat.config.js and add Ganache network URL: http://127.0.0.1:7545

- Accounts: Use Ganache Account #0 private key

