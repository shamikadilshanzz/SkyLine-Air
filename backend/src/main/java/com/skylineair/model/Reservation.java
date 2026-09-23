package com.skylineair.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reservations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reservationId;

    @Column(nullable = false, unique = true)
    private String pnrCode;

    private Long userId;
    private String userName;
    private String userEmail;

    private Long flightId;
    private String flightNumber;
    private String origin;
    private String destination;
    private String departureTime;

    private LocalDateTime bookingDate = LocalDateTime.now();
    private String cabinClass = "ECONOMY";

    @Column(nullable = false)
    private BigDecimal totalAmount;

    // PENDING_PAYMENT, CONFIRMED, CANCELLED, CHECKED_IN
    private String bookingStatus = "PENDING_PAYMENT";
    private String paymentStatus = "PENDING";
    private String paymentMethod;
    private String transactionRef;

    private Boolean hasLayover = false;
    private String layoverCity;
    private String layoverAirport;
    private Double layoverDurationHours = 0.0;
    private Boolean hotelBooked = false;
    private Long hotelId;
    private String hotelName;
    private String hotelCity;
    private String hotelCountry;
    private String hotelRoomType;
    private BigDecimal hotelPrice = BigDecimal.ZERO;
    private String hotelVoucherCode;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @JoinColumn(name = "reservation_id")
    private List<Passenger> passengers = new ArrayList<>();
}
