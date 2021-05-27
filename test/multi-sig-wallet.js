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
            await wallet.approveTransaction(0, { from: owners[0] })
            await wallet.approveTransaction(0, { from: owners[1] })
        })

        it('should execute', async () => {
            // tx is approved
            const isApproved = await wallet.isApproved(0);
            assert.equal(isApproved, true);

            // tx is not rejected
            const isRejected = await wallet.isRejected(0);
            assert.equal(isRejected, false);

            const res = await wallet.executeTransaction(0, { from: owners[0] })
            const { logs } = res
    
            assert.equal(logs[0].event, "ExecuteTransaction")
            assert.equal(logs[0].args.owner, owners[0])
            assert.equal(logs[0].args.txIndex, 0)
    
            const tx = await wallet.getTransaction(0)
            assert.equal(tx.executed, true)
        })

        it('should fail if already executed', async () => {
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

        it('should fail if already rejected', async () => {
            await wallet.executeTransaction(0, { from: owners[0] })
            const to = owners[0]
            const value = 0
            const data = '0x0'
    
            await wallet.submitTransaction(to, value, data)
            await wallet.rejectTransaction(1, { from: owners[0] })
            await wallet.rejectTransaction(1, { from: owners[1] })

            await expect(
                wallet.executeTransaction(1, { from: owners[0] })
            ).to.be.rejected
        })
    })

    describe("respond to tx", () => {
        beforeEach(async () => {
            const to = owners[0]
            const value = 0
            const data = '0x0'
    
            await wallet.submitTransaction(to, value, data)
        })

        it('multiple responds should fail', async () => {
            // owner 0 approves a transaction
            await wallet.approveTransaction(0, { from: owners[0] })
            // owner 0 tries to approve it again(should fail)
            await expect(
                wallet.approveTransaction(0, { from: owners[0] })
            ).to.be.rejected
            // owner 0 tries to reject it(should fail)
            await expect(
                wallet.rejectTransaction(0, { from: owners[0] })
            ).to.be.rejected

            // owner 1 rejects a transaction
            await wallet.rejectTransaction(0, { from: owners[1] })
            // owner 1 tries to reject it again(should fail)
            await expect(
                wallet.rejectTransaction(0, { from: owners[1] })
            ).to.be.rejected
            // owner 1 tries to approve it(should fail)
            await expect(
                wallet.approveTransaction(0, { from: owners[1] })
            ).to.be.rejected
        })
    })

    describe("new tx submit", () => {
        beforeEach(async () => {
            const to = owners[0]
            const value = 0
            const data = '0x0'
    
            await wallet.submitTransaction(to, value, data)
        })

        it('new tx submit should fail as one is already pending', async () => {
            await expect(
                wallet.submitTransaction(owners[0], 0, '0x0')
            ).to.be.rejected

            const noPendingTx = await wallet.noPendingTx();
            assert.equal(noPendingTx, false, "noPendingTx but submit still failed");
        })

        it('can submit if last tx executed', async () => {
            // fetch lastTx 
            const lastTx = (await wallet.lastTx()).toNumber();

            // tx approved by 2 owners
            await wallet.approveTransaction(lastTx, { from: owners[0] })
            await wallet.approveTransaction(lastTx, { from: owners[1] })

            // tx is approved
            const isApproved = await wallet.isApproved(lastTx);
            assert.equal(isApproved, true);

            // tx is not rejected
            const isRejected = await wallet.isRejected(lastTx);
            assert.equal(isRejected, false);

            // tx execution verification
            const res = await wallet.executeTransaction(lastTx, { from: owners[0] })
            const { logs } = res
            assert.equal(logs[0].event, "ExecuteTransaction")
            assert.equal(logs[0].args.owner, owners[0])
            assert.equal(logs[0].args.txIndex, lastTx)
            const tx = await wallet.getTransaction(lastTx)
            assert.equal(tx.executed, true)

            // no pending tx
            const noPendingTx = await wallet.noPendingTx();
            assert.equal(noPendingTx, true);

            // submit new tx
            await wallet.submitTransaction(owners[0], 0, '0x0')
            const latestTx = (await wallet.lastTx()).toNumber();
            assert.equal(latestTx, lastTx + 1)
        })

        it('can submit if last tx rejected', async () => {
            // fetch lastTx 
            const lastTx = (await wallet.lastTx()).toNumber();

            // tx rejected by 2 owners
            await wallet.rejectTransaction(lastTx, { from: owners[0] })
            await wallet.rejectTransaction(lastTx, { from: owners[1] })

            // tx is not approved
            const isApproved = await wallet.isApproved(lastTx);
            assert.equal(isApproved, false);

            // tx is rejected
            const isRejected = await wallet.isRejected(lastTx);
            assert.equal(isRejected, true);

            // no pending tx
            const noPendingTx = await wallet.noPendingTx();
            assert.equal(noPendingTx, true);

            // submit new tx
            await wallet.submitTransaction(owners[0], 0, '0x0')
            const latestTx = (await wallet.lastTx()).toNumber();
            assert.equal(latestTx, lastTx + 1)
        })
    })

})