package com.skylineair.patterns.refund;

public class UnderReviewState implements RefundState {
    @Override
    public void handleReview(RefundRequestContext context) {
        // Already under review
    }

    @Override
    public void handleApprove(RefundRequestContext context) {
        context.setState(new ApprovedState());
        context.getRefundRequest().setStatus("APPROVED");
    }

    @Override
    public void handleReject(RefundRequestContext context) {
        context.setState(new RejectedState());
        context.getRefundRequest().setStatus("REJECTED");
    }

    @Override
    public void handleCredit(RefundRequestContext context) {
        throw new IllegalStateException("Cannot credit funds before airline officer approves the refund claim.");
    }

    @Override
    public String getStatusName() {
        return "UNDER_REVIEW";
    }
}
