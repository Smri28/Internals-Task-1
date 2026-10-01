// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Escrow.sol";

contract EscrowFactory {
    address[] public escrows;

    event EscrowCreated(
        address indexed escrowAddress,
        address indexed buyer,
        address indexed seller,
        address arbitrator,
        uint256 tradeAmount
    );

    function createEscrow(
        address seller,
        address arbitrator,
        uint256 tradeAmount
    )
        external
        returns (address)
    {
        Escrow escrow = new Escrow(
            msg.sender,
            seller,
            arbitrator,
            tradeAmount
        );

        escrows.push(address(escrow));

        emit EscrowCreated(
            address(escrow),
            msg.sender,
            seller,
            arbitrator,
            tradeAmount
        );

        return address(escrow);
    }

    function getEscrows()
        external
        view
        returns (address[] memory)
    {
        return escrows;
    }
}
