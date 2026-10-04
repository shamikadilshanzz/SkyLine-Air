package com.skylineair.patterns.refund;

public class RejectedState implements RefundState {
    @Override
    public void handleReview(RefundRequestContext context) {
        // Allow reopening claim
        context.setState(new UnderReviewState());
        context.getRefundRequest().setStatus("UNDER_REVIEW");
    }

    @Override
    public void handleApprove(RefundRequestContext context) {
        context.setState(new ApprovedState());
        context.getRefundRequest().setStatus("APPROVED");
    }

    @Override
    public void handleReject(RefundRequestContext context) {
        // Already rejected
    }

    @Override
    public void handleCredit(RefundRequestContext context) {
        throw new IllegalStateException("Cannot credit funds for a rejected claim.");
    }

    @Override
    public String getStatusName() {
        return "REJECTED";
    }
}
