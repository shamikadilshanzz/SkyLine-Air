package com.skylineair.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "refund_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RefundRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long refundId;

    @Column(nullable = false, unique = true)
    private String refundReference;

    private String pnr;
    private Long reservationId;
    private String userName;
    private String userEmail;
    private String flightNumber;

    private BigDecimal originalFare;
    private BigDecimal cancellationFee;
    private BigDecimal refundAmount;

    @Column(columnDefinition = "TEXT")
    private String reason;

    // Status: REQUESTED, UNDER_REVIEW, APPROVED, PROCESSED, REJECTED
    private String status = "REQUESTED";

    private LocalDateTime requestedDate = LocalDateTime.now();
    private LocalDateTime processedAt;
}
