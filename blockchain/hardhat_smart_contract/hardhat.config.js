import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config = {
  solidity: "0.8.28",
  networks: {
    localhost: {
      url: process.env.RPC_URL_LOCAL || "http://127.0.0.1:8545",
      accounts: process.env.PRIVATE_KEY_LOCAL ? [process.env.PRIVATE_KEY_LOCAL] : undefined,
    },
  },
};

export default config;
