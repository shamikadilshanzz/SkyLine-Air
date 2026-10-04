package com.skylineair.patterns.refund;

import com.skylineair.model.RefundRequest;

/**
 * Context class for State Pattern
 */
public class RefundRequestContext {

    private final RefundRequest refundRequest;
    private RefundState currentState;

    public RefundRequestContext(RefundRequest refundRequest) {
        this.refundRequest = refundRequest;
        String status = refundRequest.getStatus() != null ? refundRequest.getStatus() : "UNDER_REVIEW";
        switch (status) {
            case "APPROVED":
                this.currentState = new ApprovedState();
                break;
            case "REJECTED":
                this.currentState = new RejectedState();
                break;
            case "PROCESSED":
            case "CREDITED":
                this.currentState = new CreditedState();
                break;
            default:
                this.currentState = new UnderReviewState();
                break;
        }
    }

    public void setState(RefundState state) {
        this.currentState = state;
    }

    public RefundState getState() {
        return currentState;
    }

    public RefundRequest getRefundRequest() {
        return refundRequest;
    }

    public void review() {
        currentState.handleReview(this);
    }

    public void approve() {
        currentState.handleApprove(this);
    }

    public void reject() {
        currentState.handleReject(this);
    }

    public void credit() {
        currentState.handleCredit(this);
    }
}
