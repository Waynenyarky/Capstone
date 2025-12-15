require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.28",
  networks: {
    development: {
      url: "http://127.0.0.1:7545",
      accounts: ["0xc370bad252bec12099edfcc3414125c6a3e485801a84464c4a1412420062daec"],
    },
  },
};
