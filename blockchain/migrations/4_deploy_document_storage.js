const AccessControl = artifacts.require("AccessControl");
const DocumentStorage = artifacts.require("DocumentStorage");

module.exports = function (deployer) {
  // Get the deployed AccessControl contract address
  return AccessControl.deployed().then((accessControl) => {
    // Deploy DocumentStorage with AccessControl address
    return deployer.deploy(DocumentStorage, accessControl.address);
  });
};
