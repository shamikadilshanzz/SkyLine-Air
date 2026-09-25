package com.skylineair.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PriceAlert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long alertId;

    private Long userId;

    @Column(nullable = false)
    private String userEmail;

    @Column(nullable = false)
    private String originCode;
    private String originCity;

    @Column(nullable = false)
    private String destinationCode;
    private String destinationCity;

    @Column(nullable = false)
    private BigDecimal targetPrice;

    private String cabinClass = "ECONOMY";
    private String frequency = "INSTANT"; // INSTANT, DAILY, WEEKLY
    private String status = "ACTIVE"; // ACTIVE, PAUSED, TRIGGERED

    private LocalDateTime createdAt = LocalDateTime.now();
}
