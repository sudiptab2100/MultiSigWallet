const { assert, expect } = require("chai")
const chai = require("chai")
chai.use(require('chai-as-promised'))

const MultiSigWallet = artifacts.require("MultiSigWallet")

contract("MultiSigWallet", accounts => {
    const owners = [accounts[0], accounts[1], accounts[2]]
    const NUM_CONFIRMATION_REQUIRED = 2

    let wallet
    beforeEach(async () => {
        wallet = await MultiSigWallet.new(owners, NUM_CONFIRMATION_REQUIRED)
    })
    describe("executeTransaction", () => {
        beforeEach(async () => {
            const to = owners[0]
            const value = 0
            const data = '0x0'
    
            await wallet.submitTransaction(to, value, data)
            await wallet.confirmTransaction(0, { from: owners[0] })
            await wallet.confirmTransaction(0, { from: owners[1] })
        })

        it('should execute', async () => {
            const res = await wallet.executeTransaction(0, { from: owners[0] })
            const { logs } = res
    
            assert.equal(logs[0].event, "ExecuteTransaction")
            assert.equal(logs[0].args.owner, owners[0])
            assert.equal(logs[0].args.txIndex, 0)
    
            const tx = await wallet.getTransaction(0)
            assert.equal(tx.executed, true)
        })

        it('should reject if already executed', async () => {
            await wallet.executeTransaction(0, { from: owners[0] })

            // try {
            //     await wallet.executeTransaction(0, { from: owners[0] })
            //     throw new Error("tx did not fail")
            // } catch (error) {
            //     assert.equal(error.reason, "tx already executed")
            // }

            await expect(
                wallet.executeTransaction(0, { from: owners[0] })
            ).to.be.rejected
        })
    })

})