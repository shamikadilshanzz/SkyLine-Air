package com.skylineair.patterns.refund;

public class CreditedState implements RefundState {
    @Override
    public void handleReview(RefundRequestContext context) {
        throw new IllegalStateException("Final payout already completed.");
    }

    @Override
    public void handleApprove(RefundRequestContext context) {
        throw new IllegalStateException("Final payout already completed.");
    }

    @Override
    public void handleReject(RefundRequestContext context) {
        throw new IllegalStateException("Final payout already completed.");
    }

    @Override
    public void handleCredit(RefundRequestContext context) {
        // Terminal state
    }

    @Override
    public String getStatusName() {
        return "PROCESSED";
    }
}
