require("dotenv").config();

const {
    ethers
} = require("ethers");

const provider = new ethers.JsonRpcProvider(
    process.env.RPC_URL
);

const buyer = new ethers.Wallet(
    process.env.BUYER_PRIVATE_KEY,
    provider
);

const arbitrator = new ethers.Wallet(
    process.env.ARBITRATOR_PRIVATE_KEY,
    provider
);

const sellerAddress = process.env.SELLER_ADDRESS;
const factoryAddress = process.env.FACTORY_ADDRESS;

const TRADE_AMOUNT = ethers.parseEther("0.001");

const factoryABI = [
    "function createEscrow(address seller, address arbitrator, uint256 tradeAmount) external returns (address)",
    "function getEscrows() external view returns (address[])"
];

const escrowABI = [
    "function deposit() external payable",
    "function release() external",
    "function raiseDispute() external",
    "function resolveDispute(uint256 sellerPercent) external",

    "function state() external view returns (uint8)",
    "function tradeAmount() external view returns (uint256)",
    "function buyer() external view returns (address)",
    "function seller() external view returns (address)",
    "function arbitrator() external view returns (address)"
];

function stateName(state) {
    const names = [
        "AWAITING_PAYMENT",
        "FUNDED",
        "DISPUTED",
        "COMPLETE"
    ];

    return names[Number(state)] ?? "UNKNOWN";
}

async function createEscrow(factory) {
    console.log("\nCreating escrow...");

    const tx = await factory.createEscrow(
        sellerAddress,
        arbitrator.address,
        TRADE_AMOUNT
    );

    console.log("TX:", tx.hash);

    await tx.wait();

    const escrows = await factory.getEscrows();

    const escrowAddress =
        escrows[escrows.length - 1];

    console.log("Escrow created:");
    console.log(escrowAddress);

    return escrowAddress;
}

async function main() {
    console.log("=================================");
    console.log("      TRUSTLESS P2P ESCROW");
    console.log("=================================");

    console.log("\nBuyer:");
    console.log(buyer.address);

    console.log("\nSeller:");
    console.log(sellerAddress);

    console.log("\nArbitrator:");
    console.log(arbitrator.address);

    console.log("\nTrade amount:");
    console.log(
        ethers.formatEther(TRADE_AMOUNT),
        "ETH"
    );

    const factory = new ethers.Contract(
        factoryAddress,
        factoryABI,
        buyer
    );

    // ==========================================
    // NORMAL TRADE
    // ==========================================

    console.log("\n\n===== NORMAL TRADE =====");

    const escrowAddress1 =
        await createEscrow(factory);

    const escrow1 = new ethers.Contract(
        escrowAddress1,
        escrowABI,
        buyer
    );

    console.log("\nDepositing 0.001 ETH...");

    let tx = await escrow1.deposit({
        value: TRADE_AMOUNT
    });

    console.log("Deposit TX:", tx.hash);

    await tx.wait();

    let state = await escrow1.state();

    console.log(
        "State:",
        stateName(state)
    );

    console.log(
        "Escrow balance:",
        ethers.formatEther(
            await provider.getBalance(
                escrowAddress1
            )
        ),
        "ETH"
    );

    console.log("\nReleasing payment...");

    tx = await escrow1.release();

    console.log("Release TX:", tx.hash);

    await tx.wait();

    state = await escrow1.state();

    console.log(
        "State:",
        stateName(state)
    );

    console.log(
        "Escrow balance:",
        ethers.formatEther(
            await provider.getBalance(
                escrowAddress1
            )
        ),
        "ETH"
    );

    console.log(
        "\n✅ NORMAL TRADE COMPLETE"
    );

    // ==========================================
    // DOUBLE RELEASE TEST
    // ==========================================

    console.log(
        "\nTesting double release protection..."
    );

    try {
        tx = await escrow1.release();
        await tx.wait();

        console.log(
            "❌ ERROR: second release succeeded"
        );
    } catch (error) {
        console.log(
            "✅ Second release correctly rejected"
        );
    }

    // ==========================================
    // DISPUTE TRADE
    // ==========================================

    console.log("\n\n===== DISPUTE TRADE =====");

    const escrowAddress2 =
        await createEscrow(factory);

    const escrow2Buyer =
        new ethers.Contract(
            escrowAddress2,
            escrowABI,
            buyer
        );

    console.log("\nDepositing 0.001 ETH...");

    tx = await escrow2Buyer.deposit({
        value: TRADE_AMOUNT
    });

    await tx.wait();

    state = await escrow2Buyer.state();

    console.log(
        "State:",
        stateName(state)
    );

    console.log("\nRaising dispute...");

    tx = await escrow2Buyer.raiseDispute();

    console.log(
        "Dispute TX:",
        tx.hash
    );

    await tx.wait();

    state = await escrow2Buyer.state();

    console.log(
        "State:",
        stateName(state)
    );

    // Connect the SAME escrow to arbitrator
    const escrow2Arbitrator =
        escrow2Buyer.connect(arbitrator);

    console.log(
        "\nArbitrator resolving dispute..."
    );

    console.log(
        "Decision: 70% Seller / 30% Buyer"
    );

    const sellerBefore =
        await provider.getBalance(
            sellerAddress
        );

    tx =
        await escrow2Arbitrator.resolveDispute(
            70
        );

    console.log(
        "Resolution TX:",
        tx.hash
    );

    await tx.wait();

    const sellerAfter =
        await provider.getBalance(
            sellerAddress
        );

    state = await escrow2Buyer.state();

    console.log(
        "State:",
        stateName(state)
    );

    console.log(
        "Seller received:",
        ethers.formatEther(
            sellerAfter - sellerBefore
        ),
        "ETH"
    );

    console.log(
        "Escrow balance:",
        ethers.formatEther(
            await provider.getBalance(
                escrowAddress2
            )
        ),
        "ETH"
    );

    console.log(
        "\n✅ DISPUTE RESOLVED"
    );

    console.log("\n=================================");
    console.log("          DEMO COMPLETE");
    console.log("=================================");
}

main().catch((error) => {
    console.error("\n❌ ERROR");

    console.error(
        error.shortMessage ||
        error.reason ||
        error.message
    );

    process.exit(1);
});
