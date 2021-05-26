const MultiSigWallet = artifacts.require("MultiSigWallet");

module.exports = function (deployer, network, accounts) {
    const owners = accounts.slice(0, 3);
    const numConfirmationRequired = 2;
    deployer.deploy(MultiSigWallet, owners, numConfirmationRequired);
};