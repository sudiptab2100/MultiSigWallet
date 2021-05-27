// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MultiSigWallet {
    event Deposit(address indexed sender, uint amount, uint balance);
    event SubmitTransaction(
        address indexed owner,
        uint indexed txIndex,
        address indexed to,
        uint value,
        bytes data
    );
    event ApproveTransaction(address indexed owner, uint indexed txIndex);
    event RejectTransaction(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public numConfirmationsRequired;

    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        uint numApprovals;
        uint numRejections;
    }

    // mapping from tx index => owner => bool
    mapping(uint => mapping(address => bool)) private responded;

    mapping(uint => bool) public isApproved;
    mapping(uint => bool) public isRejected;

    uint public lastTx;

    Transaction[] public transactions;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "not owner");
        _;
    }

    modifier txExists(uint _txIndex) {
        require(_txIndex < transactions.length, "tx does not exist");
        _;
    }

    modifier canSubmit() {
        require(noPendingTx(), "a tx is pending");
        _;
    }

    modifier notExecuted(uint _txIndex) {
        require(!transactions[_txIndex].executed, "tx already executed");
        _;
    }

    modifier notResponded(uint _txIndex) {
        require(!responded[_txIndex][msg.sender], "already responded to the tx");
        responded[_txIndex][msg.sender] = true;
        _;
    }

    constructor(address[] memory _owners, uint _numConfirmationsRequired) {
        require(_owners.length > 0, "owners required");
        require(
            _numConfirmationsRequired > 0 && _numConfirmationsRequired <= _owners.length,
            "invalid number of required confirmations"
        );

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
        lastTx = ~uint(0);
    }

    receive() payable external {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function noPendingTx() public view returns(bool) {
        uint _txIndex = lastTx;
        if(lastTx == ~uint(0)) return true;
        bool status = (transactions[_txIndex].executed) || (isRejected[_txIndex]);
        return status;
    }

    function notRespondedYet(uint _txIndex) external view returns(bool) {
        return responded[_txIndex][msg.sender];
    }

    function submitTransaction(address _to, uint _value, bytes memory _data)
        public
        onlyOwner
        canSubmit
    {
        uint txIndex = transactions.length;
        lastTx = txIndex;

        transactions.push(Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            numApprovals: 0,
            numRejections: 0
        }));

        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
    }

    function approveTransaction(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notResponded(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numApprovals += 1;
        if(transaction.numApprovals >= numConfirmationsRequired) isApproved[_txIndex] = true;

        emit ApproveTransaction(msg.sender, _txIndex);
    }

    function executeTransaction(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        require(
            isApproved[_txIndex],
            "cannot execute tx"
        );

        transaction.executed = true;

        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "tx failed");

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    function rejectTransaction(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notResponded(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        transaction.numRejections += 1;
        if(owners.length - transaction.numRejections < numConfirmationsRequired) isRejected[_txIndex] = true;

        emit RejectTransaction(msg.sender, _txIndex);
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() public view returns (uint) {
        return transactions.length;
    }

    function getTransaction(uint _txIndex)
        public
        view
        returns (address to, uint value, bytes memory data, bool executed, uint numApprovals, uint numRejections)
    {
        Transaction storage transaction = transactions[_txIndex];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numApprovals,
            transaction.numRejections
        );
    }
}
