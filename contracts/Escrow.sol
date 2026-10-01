// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Escrow is ReentrancyGuard {
    address public immutable buyer;
    address public immutable seller;
    address public immutable arbitrator;

    uint256 public immutable tradeAmount;

    enum State {
        AWAITING_PAYMENT,
        FUNDED,
        DISPUTED,
        COMPLETE
    }

    State public state;

    event Deposited(address indexed buyer, uint256 amount);
    event Released(address indexed seller, uint256 amount);
    event DisputeRaised(address indexed raisedBy);

    event DisputeResolved(
        uint256 sellerPercent,
        uint256 sellerAmount,
        uint256 buyerRefund
    );

    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer");
        _;
    }

    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "Only arbitrator");
        _;
    }

    modifier onlyBuyerOrSeller() {
        require(
            msg.sender == buyer || msg.sender == seller,
            "Only buyer or seller"
        );
        _;
    }

    constructor(
        address _buyer,
        address _seller,
        address _arbitrator,
        uint256 _tradeAmount
    ) {
        require(_buyer != address(0), "Invalid buyer");
        require(_seller != address(0), "Invalid seller");
        require(_arbitrator != address(0), "Invalid arbitrator");
        require(_tradeAmount > 0, "Amount must be > 0");

        require(_buyer != _seller, "Buyer and seller must differ");
        require(_buyer != _arbitrator, "Buyer cannot be arbitrator");
        require(_seller != _arbitrator, "Seller cannot be arbitrator");

        buyer = _buyer;
        seller = _seller;
        arbitrator = _arbitrator;
        tradeAmount = _tradeAmount;

        state = State.AWAITING_PAYMENT;
    }

    function deposit() external payable onlyBuyer {
        require(
            state == State.AWAITING_PAYMENT,
            "Escrow already funded"
        );

        require(
            msg.value == tradeAmount,
            "Send exact trade amount"
        );

        state = State.FUNDED;

        emit Deposited(msg.sender, msg.value);
    }

    function release() external onlyBuyer nonReentrant {
        require(
            state == State.FUNDED,
            "Funds cannot be released"
        );

        uint256 amount = address(this).balance;

        state = State.COMPLETE;

        (bool success, ) = payable(seller).call{
            value: amount
        }("");

        require(success, "Payment failed");

        emit Released(seller, amount);
    }

    function raiseDispute()
        external
        onlyBuyerOrSeller
    {
        require(
            state == State.FUNDED,
            "Cannot dispute"
        );

        state = State.DISPUTED;

        emit DisputeRaised(msg.sender);
    }

    function resolveDispute(
        uint256 sellerPercent
    )
        external
        onlyArbitrator
        nonReentrant
    {
        require(
            state == State.DISPUTED,
            "No active dispute"
        );

        require(
            sellerPercent <= 100,
            "Percentage must be 0-100"
        );

        uint256 totalAmount = address(this).balance;

        uint256 sellerAmount =
            (totalAmount * sellerPercent) / 100;

        uint256 buyerAmount =
            totalAmount - sellerAmount;

        state = State.COMPLETE;

        if (sellerAmount > 0) {
            (bool sellerSuccess, ) =
                payable(seller).call{
                    value: sellerAmount
                }("");

            require(
                sellerSuccess,
                "Seller payment failed"
            );
        }

        if (buyerAmount > 0) {
            (bool buyerSuccess, ) =
                payable(buyer).call{
                    value: buyerAmount
                }("");

            require(
                buyerSuccess,
                "Buyer refund failed"
            );
        }

        emit DisputeResolved(
            sellerPercent,
            sellerAmount,
            buyerAmount
        );
    }
}
