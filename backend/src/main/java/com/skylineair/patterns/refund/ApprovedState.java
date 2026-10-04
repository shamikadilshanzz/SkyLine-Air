package com.skylineair.patterns.refund;

public class ApprovedState implements RefundState {
    @Override
    public void handleReview(RefundRequestContext context) {
        throw new IllegalStateException("Claim is already approved; cannot return to under review.");
    }

    @Override
    public void handleApprove(RefundRequestContext context) {
        // Already approved
    }

    @Override
    public void handleReject(RefundRequestContext context) {
        context.setState(new RejectedState());
        context.getRefundRequest().setStatus("REJECTED");
    }

    @Override
    public void handleCredit(RefundRequestContext context) {
        context.setState(new CreditedState());
        context.getRefundRequest().setStatus("PROCESSED");
    }

    @Override
    public String getStatusName() {
        return "APPROVED";
    }
}
