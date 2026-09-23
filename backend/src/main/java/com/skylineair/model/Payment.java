package com.skylineair.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentId;

    private Long reservationId;

    @Column(nullable = false, unique = true)
    private String transactionReference;

    @Column(nullable = false)
    private String paymentMethod;

    @Column(nullable = false)
    private BigDecimal amount;

    private String paymentStatus = "SUCCESS"; // SUCCESS, FAILED, PENDING, REFUNDED
    private LocalDateTime paymentTimestamp = LocalDateTime.now();
}
