require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    ganache: {
      url: process.env.GANACHE_RPC_URL || "http://127.0.0.1:7545",
      accounts: (() => {
        const key = process.env.DEPLOYER_PRIVATE_KEY;
        // Check if key is set and valid
        if (!key || key === "your_ganache_account_0_private_key_here") {
          return []; // Return empty array - Hardhat will show error
        }
        // Validate format
        if (key.startsWith("0x") && key.length === 66) {
          return [key];
        }
        return []; // Invalid format - Hardhat will show error
      })(),
      chainId: 1337,
    },
    hardhat: {
      chainId: 1337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
