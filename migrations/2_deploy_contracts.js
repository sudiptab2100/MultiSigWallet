const MultiSigWallet = artifacts.require("MultiSigWallet");

module.exports = function (deployer, network, accounts) {
    const owners = [
        "0x5bb2BC3165302808C069B46B085e56172634E118", 
        "0x27380034Afa75eC72652769112800619E7C8bAFe", 
        "0x61842026aC0332E4c08A0Fd68254cb6107fa4E8E"
    ];
    const numConfirmationRequired = 2;
    deployer.deploy(MultiSigWallet, owners, numConfirmationRequired);
};