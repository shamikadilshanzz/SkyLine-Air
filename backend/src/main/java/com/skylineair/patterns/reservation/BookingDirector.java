package com.skylineair.patterns.reservation;

import com.skylineair.model.Reservation;
import java.math.BigDecimal;

/**
 * Director class for Builder Pattern
 * Provides pre-configured standard building routines for different reservation types.
 */
public class BookingDirector {

    public Reservation constructStandardDirectBooking(String pnr, Long userId, String userName, String userEmail,
                                                      Long flightId, String flightNumber, String origin, String destination,
                                                      String depTime, String passFirstName, String passLastName, String passport,
                                                      String seat, BigDecimal fare) {
        return new ReservationBuilder()
                .withPnr(pnr)
                .forUser(userId, userName, userEmail)
                .forFlight(flightId, flightNumber, origin, destination, depTime)
                .inCabinClass("ECONOMY")
                .addPassenger(passFirstName, passLastName, passport, seat, "Standard Meal", 0)
                .withTotalAmount(fare)
                .build();
    }

    public Reservation constructVIPTransitBookingWithHotel(String pnr, Long userId, String userName, String userEmail,
                                                           Long flightId, String flightNumber, String origin, String destination,
                                                           String depTime, String passFirstName, String passLastName, String passport,
                                                           String seat, String layoverAirport, String layoverCity, Double durationHours,
                                                           String hotelName, BigDecimal hotelPrice, String voucherCode, BigDecimal totalFare) {
        return new ReservationBuilder()
                .withPnr(pnr)
                .forUser(userId, userName, userEmail)
                .forFlight(flightId, flightNumber, origin, destination, depTime)
                .inCabinClass("BUSINESS")
                .addPassenger(passFirstName, passLastName, passport, seat, "Executive Chef Selection", 20)
                .withLayoverDetails(layoverAirport, layoverCity, durationHours)
                .withHotelTransit(hotelName, hotelPrice, voucherCode)
                .withTotalAmount(totalFare)
                .build();
    }
}
