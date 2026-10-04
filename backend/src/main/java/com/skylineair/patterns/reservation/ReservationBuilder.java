package com.skylineair.patterns.reservation;

import com.skylineair.model.Passenger;
import com.skylineair.model.Reservation;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * BUILDER PATTERN - ReservationBuilder
 * Member: KUMARANAYAKA N A D S (IT25103928)
 * Module: Reserve a Ticket & Seat Allocation
 *
 * Provides a clean, flexible builder to construct complex Flight Reservations.
 */
public class ReservationBuilder {

    private String pnrCode;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long flightId;
    private String flightNumber;
    private String origin;
    private String destination;
    private String departureTime;
    private String cabinClass = "ECONOMY";
    private BigDecimal totalAmount = BigDecimal.ZERO;
    private String bookingStatus = "PENDING_PAYMENT";
    private Boolean hasLayover = false;
    private String layoverAirport;
    private String layoverCity;
    private Double layoverDurationHours = 0.0;
    private Boolean hotelBooked = false;
    private String hotelName;
    private BigDecimal hotelPrice = BigDecimal.ZERO;
    private String hotelVoucherCode;
    private List<Passenger> passengers = new ArrayList<>();

    public ReservationBuilder withPnr(String pnr) {
        this.pnrCode = pnr;
        return this;
    }

    public ReservationBuilder forUser(Long userId, String name, String email) {
        this.userId = userId;
        this.userName = name;
        this.userEmail = email;
        return this;
    }

    public ReservationBuilder forFlight(Long flightId, String flightNumber, String origin, String destination, String departureTime) {
        this.flightId = flightId;
        this.flightNumber = flightNumber;
        this.origin = origin;
        this.destination = destination;
        this.departureTime = departureTime;
        return this;
    }

    public ReservationBuilder inCabinClass(String cabinClass) {
        this.cabinClass = cabinClass;
        return this;
    }

    public ReservationBuilder addPassenger(String firstName, String lastName, String passportNumber, String seatNumber, String mealPreference, Integer extraBaggageKg) {
        Passenger p = new Passenger();
        p.setFirstName(firstName);
        p.setLastName(lastName);
        p.setPassportNumber(passportNumber);
        p.setSeatNumber(seatNumber);
        p.setCabinClass(this.cabinClass);
        p.setMealPreference(mealPreference);
        p.setExtraBaggageKg(extraBaggageKg);
        this.passengers.add(p);
        return this;
    }

    public ReservationBuilder withLayoverDetails(String airport, String city, Double durationHours) {
        this.hasLayover = true;
        this.layoverAirport = airport;
        this.layoverCity = city;
        this.layoverDurationHours = durationHours;
        return this;
    }

    public ReservationBuilder withHotelTransit(String hotelName, BigDecimal hotelPrice, String voucherCode) {
        this.hotelBooked = true;
        this.hotelName = hotelName;
        this.hotelPrice = hotelPrice;
        this.hotelVoucherCode = voucherCode;
        return this;
    }

    public ReservationBuilder withTotalAmount(BigDecimal amount) {
        this.totalAmount = amount;
        return this;
    }

    public Reservation build() {
        Reservation res = new Reservation();
        res.setPnrCode(this.pnrCode != null ? this.pnrCode : "SK-" + (100000 + (int)(Math.random() * 900000)));
        res.setUserId(this.userId);
        res.setUserName(this.userName);
        res.setUserEmail(this.userEmail);
        res.setFlightId(this.flightId);
        res.setFlightNumber(this.flightNumber);
        res.setOrigin(this.origin);
        res.setDestination(this.destination);
        res.setDepartureTime(this.departureTime);
        res.setCabinClass(this.cabinClass);
        res.setTotalAmount(this.totalAmount);
        res.setBookingStatus(this.bookingStatus);
        res.setBookingDate(LocalDateTime.now());
        res.setHasLayover(this.hasLayover);
        res.setLayoverAirport(this.layoverAirport);
        res.setLayoverCity(this.layoverCity);
        res.setLayoverDurationHours(this.layoverDurationHours);
        res.setHotelBooked(this.hotelBooked);
        res.setHotelName(this.hotelName);
        res.setHotelPrice(this.hotelPrice);
        res.setHotelVoucherCode(this.hotelVoucherCode);
        
        res.setPassengers(this.passengers);
        return res;
    }
}
