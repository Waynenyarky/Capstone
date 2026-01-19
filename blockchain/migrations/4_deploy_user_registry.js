const AccessControl = artifacts.require("AccessControl");
const UserRegistry = artifacts.require("UserRegistry");

module.exports = function (deployer) {
  // Get the deployed AccessControl contract address
  return deployer.deploy(AccessControl).then(() => {
    return AccessControl.deployed().then((accessControl) => {
      // Deploy UserRegistry with AccessControl address
      return deployer.deploy(UserRegistry, accessControl.address);
    });
  });
};
