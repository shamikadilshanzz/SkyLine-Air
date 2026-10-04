package com.skylineair.patterns.refund;

import com.skylineair.model.RefundRequest;

/**
 * STATE PATTERN - RefundState Interface
 * Member: Cancel Ticket and Process Refund
 *
 * Encapsulates status transitions and business rules for refund lifecycles.
 */
public interface RefundState {
    void handleReview(RefundRequestContext context);
    void handleApprove(RefundRequestContext context);
    void handleReject(RefundRequestContext context);
    void handleCredit(RefundRequestContext context);
    String getStatusName();
}
