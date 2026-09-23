package com.skylineair.controller;

import com.skylineair.model.Flight;
import com.skylineair.model.Payment;
import com.skylineair.model.Reservation;
import com.skylineair.repository.FlightRepository;
import com.skylineair.repository.PaymentRepository;
import com.skylineair.repository.ReservationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final ReservationRepository reservationRepository;
    private final FlightRepository flightRepository;

    public PaymentController(PaymentRepository paymentRepository,
                             ReservationRepository reservationRepository,
                             FlightRepository flightRepository) {
        this.paymentRepository = paymentRepository;
        this.reservationRepository = reservationRepository;
        this.flightRepository = flightRepository;
    }

    @GetMapping
    public java.util.List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    @GetMapping("/transaction/{txnRef}")
    public ResponseEntity<Payment> getPaymentByTransactionReference(@PathVariable String txnRef) {
        return paymentRepository.findByTransactionReference(txnRef)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/reservation/{resId}")
    public ResponseEntity<Payment> getPaymentByReservationId(@PathVariable Long resId) {
        return paymentRepository.findByReservationId(resId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/process")
    public ResponseEntity<?> processPayment(@RequestBody Payment payment) {
        if (payment.getAmount() == null || payment.getPaymentMethod() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Amount and payment method are required"));
        }

        if (payment.getTransactionReference() == null || payment.getTransactionReference().isEmpty()) {
            payment.setTransactionReference("TXN-" + System.currentTimeMillis() + (10 + new Random().nextInt(90)));
        }

        payment.setPaymentStatus("SUCCESS");
        payment.setPaymentTimestamp(LocalDateTime.now());

        Payment savedPayment = paymentRepository.save(payment);

        // Update reservation status
        if (payment.getReservationId() != null) {
            Optional<Reservation> resOpt = reservationRepository.findById(payment.getReservationId());
            if (resOpt.isPresent()) {
                Reservation res = resOpt.get();
                res.setBookingStatus("CONFIRMED");
                res.setPaymentStatus("PAID");
                res.setPaymentMethod(payment.getPaymentMethod());
                res.setTransactionRef(payment.getTransactionReference());
                reservationRepository.save(res);

                // Update available seats on flight
                if (res.getFlightId() != null) {
                    flightRepository.findById(res.getFlightId()).ifPresent(flight -> {
                        int currentSeats = flight.getAvailableSeats() != null ? flight.getAvailableSeats() : 30;
                        int passCount = (res.getPassengers() != null && !res.getPassengers().isEmpty()) ? res.getPassengers().size() : 1;
                        flight.setAvailableSeats(Math.max(0, currentSeats - passCount));
                        flightRepository.save(flight);
                    });
                }
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(savedPayment);
    }
}
