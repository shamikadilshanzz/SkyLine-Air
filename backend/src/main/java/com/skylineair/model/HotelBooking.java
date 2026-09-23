package com.skylineair.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "hotel_bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HotelBooking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long hotelBookingId;

    private Long hotelId;
    private String hotelName;
    private Long userId;
    private String guestEmail;
    private String voucherCode;
    private Long reservationId;
    private String pnrCode;
    private String passengerName;

    private String roomType = "Deluxe Transit Suite";
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Boolean isComplimentary = false;
    private BigDecimal amount;
    private String bookingStatus = "CONFIRMED";
    private LocalDateTime createdTimestamp = LocalDateTime.now();
}
