# Trustless P2P Escrow

## Overview
This project is a simple peer-to-peer escrow system built on Ethereum. It allows a buyer to lock ETH inside a smart contract before the seller completes the work or delivers the product.

If the buyer is satisfied, they can release the payment to the seller. If there is a dispute, the arbitrator decides how the locked money should be divided between the buyer and seller.

A factory contract is used to create a separate escrow contract for every trade. The project also includes protections against reentrancy, double payment, and unauthorized access.

## Architecture
The project has two main smart contracts.

**EscrowFactory.sol** is used to create a new escrow contract for every new trade.

**Escrow.sol** handles the actual trade. It stores the buyer, seller, arbitrator, trade amount, and current state of the escrow. The buyer deposits the ETH into this contract, and after the work is completed, the buyer can release the payment to the seller.

If there is a dispute, the arbitrator can decide what percentage of the money goes to the seller and the remaining amount is refunded to the buyer.

## Roles
- Buyer
- Seller
- Arbitrator

## Transaction Flow
Normal flow:
Create escrow -> Deposit -> Release -> Complete

Dispute flow:
Create escrow -> Deposit -> Raise dispute ->
Arbitrator resolves percentage -> Complete

## Security
The escrow contract includes a few basic security checks to make sure the funds cannot be misused.


These checks help make sure that the ETH can only be transferred according to the rules of the escrow.

### Reentrancy Protection
For **reentrancy protection**, the contract follows the Checks-Effects-Interactions pattern. This means it first checks all the conditions, then updates the contract state, and only after that sends ETH. The `nonReentrant` modifier from OpenZeppelin is also used on functions that transfer ETH.

### No Double Release
To prevent **double release**, the escrow uses different states such as `FUNDED`, `DISPUTED`, and `COMPLETE`. Once the payment is released or a dispute is resolved, the state becomes `COMPLETE`. After this, the same escrow cannot release the funds again.

### Access Control
The contract also has **access control**. Only the buyer can release the payment normally, only the buyer or seller can raise a dispute, and only the selected arbitrator can resolve the dispute.

## Multi-Contract Deployment
The project uses a factory contract so that every trade gets its own separate escrow contract.

The `EscrowFactory.sol` contract is deployed once. Whenever a new trade starts, the factory creates a new `Escrow.sol` contract with its own buyer, seller, arbitrator, and trade amount.

This keeps different trades separate from each other. For example, if there are three different buyers and sellers, the factory can create three different escrow contracts instead of storing everything inside one large contract.

This also makes the system easier to manage because each escrow contract only handles one trade and its own funds.

## Arbitrator Percentage Settlement
resolveDispute(70)
→ 70% Seller
→ 30% Buyer

