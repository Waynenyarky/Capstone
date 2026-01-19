const AccessControl = artifacts.require("AccessControl");
const AuditLog = artifacts.require("AuditLog");

module.exports = function (deployer) {
  // Get the deployed AccessControl contract address
  return AccessControl.deployed().then((accessControl) => {
    // Deploy AuditLog with AccessControl address
    return deployer.deploy(AuditLog, accessControl.address);
  });
};
