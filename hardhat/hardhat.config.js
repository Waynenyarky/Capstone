import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();
export default {
  solidity: "0.8.28",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: [
        "0x520009e9dad06e2247ae431174337389bc553dca9b530ef5b8b6934407d7679b"
      ],
    },
  },
};
