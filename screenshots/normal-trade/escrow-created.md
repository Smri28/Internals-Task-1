<img width="500" height="550" alt="image" src="https://github.com/user-attachments/assets/a43a2842-c452-4505-9cf7-ebdc5516726b" />
the newly created escrow is in state 0, which represents AWAITING_PAYMENT.

The trade amount is set to 0.001 ETH, which is:

1000000000000000 wei

At this point, the escrow contract has been created, but the buyer has not yet deposited the money.

State: 0 = AWAITING_PAYMENT

This shows that every escrow starts in a controlled initial state and cannot directly release any funds before being funded.
