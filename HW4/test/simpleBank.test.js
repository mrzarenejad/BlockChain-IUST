var SimpleBank = artifacts.require("./SimpleBank.sol");

const ether = 10**18; // 1 ether = 1000000000000000000 wei
const initialDepositsBalance = 30 * ether;

contract("SimpleBank - basic initialization", function(accounts) {
  const alice = accounts[1];

  it("should deposit correct amount", async () => {
    const bank = await SimpleBank.deployed();
    const deposit = 10 * ether;

    const receipt = await bank.addBalance({from: alice, value: web3.utils.toBN(deposit)});

    const balance = await bank.getBalance({from: alice});
    assert.equal(balance, deposit,
        "deposit amount incorrect, check deposit method");
    const depositsBalance = await bank.getContractBalance();
    assert.equal(depositsBalance, initialDepositsBalance + deposit,
        "bank deposits balance should be increased");

    const expectedEventResult = {accountAddress: alice, amount: deposit};
    assert.equal(receipt.logs[0].args.accountAddress, expectedEventResult.accountAddress,
        "LogDepositMade event accountAddress property not emitted");
    assert.equal(receipt.logs[0].args.amount, expectedEventResult.amount,
        "LogDepositMade event amount property not emitted");
  });
});

contract("SimpleBank - proper withdrawal", function(accounts) {
  const alice = accounts[1];

  it("should withdraw correct amount", async () => {
    const bank = await SimpleBank.deployed();
    const deposit = 5 * ether;

    await bank.addMoneyToContract({from: alice, value: web3.utils.toBN(deposit)});
    await bank.withdraw(web3.utils.toBN(deposit), {from: alice});

    const balance = await bank.getContractBalance({from: alice});
    assert.equal(balance, deposit - deposit, "withdraw amount incorrect");
  });
});

contract("SimpleBank - incorrect withdrawal", function(accounts) {
  const alice = accounts[1];

  it("should keep balance unchanged if withdraw greater than balance", async() => {
    const bank = await SimpleBank.deployed();
    const deposit = 3 * ether;

    await bank.addMoneyToContract({from: alice, value: web3.utils.toBN(deposit)});
    await bank.withdraw(web3.utils.toBN(deposit + 1*ether), {from: alice});

    const balance = await bank.getBalance({from: alice});
    assert.equal(balance, deposit, "balance should be kept intact");
  });
});

contract("SimpleBank - fallback works", function(accounts) {
  const alice = accounts[1];

  it("should revert ether sent to this contract through fallback", async() => {
    const bank = await SimpleBank.deployed();
    const deposit = 3 * ether;

    try {
      await bank.send(web3.utils.toBN(deposit), {from: alice});
    } catch(e) {
      assert(e, "Error: VM Exception while processing transaction: revert");
    }

    const depositsBalance = await bank.getContractBalance();
    assert.equal(depositsBalance, initialDepositsBalance, "balance should be kept intact");
  });
});
