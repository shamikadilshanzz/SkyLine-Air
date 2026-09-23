package com.skylineair.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "flights")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Flight {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long flightId;

    @Column(nullable = false, unique = true)
    private String flightNumber;

    @Column(nullable = false)
    private String originCode;

    @Column(nullable = false)
    private String destinationCode;

    private String originCity;
    private String destinationCity;

    @Column(nullable = false)
    private LocalDateTime departureTime;

    @Column(nullable = false)
    private LocalDateTime arrivalTime;

    private String duration;
    private Integer stops = 0;

    private Boolean hasLayover = false;
    private String layoverAirport;
    private String layoverCity;
    private Double layoverDurationHours = 0.0;

    private Long aircraftId;
    private String aircraftModel;
    private String tailNumber;

    @Column(nullable = false)
    private BigDecimal basePriceEconomy;

    @Column(nullable = false)
    private BigDecimal basePriceBusiness;

    @Column(nullable = false)
    private BigDecimal basePriceFirst;

    private Integer totalSeats = 60;
    private Integer availableSeats = 45;

    private String status = "ON_TIME";
    private String image;
}
