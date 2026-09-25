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
    private final com.skylineair.service.OtpService otpService;
    private final com.skylineair.service.EmailService emailService;

    public PaymentController(PaymentRepository paymentRepository,
                             ReservationRepository reservationRepository,
                             FlightRepository flightRepository,
                             com.skylineair.service.OtpService otpService,
                             com.skylineair.service.EmailService emailService) {
        this.paymentRepository = paymentRepository;
        this.reservationRepository = reservationRepository;
        this.flightRepository = flightRepository;
        this.otpService = otpService;
        this.emailService = emailService;
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

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendPaymentOtp(@RequestBody Map<String, Object> payload) {
        String email = (String) payload.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "A valid email address is required to receive OTP verification code."
            ));
        }

        String passengerName = (String) payload.get("passengerName");
        String pnr = (String) payload.get("pnr");
        Double amount = null;
        if (payload.get("amount") != null) {
            try {
                amount = Double.valueOf(payload.get("amount").toString());
            } catch (Exception ignored) {}
        }

        String otpCode = otpService.generateOtp(email);
        boolean emailSent = emailService.sendOtpEmail(email, passengerName, otpCode, amount, pnr);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", emailSent ? "Verification code sent to " + email : "OTP generated. (Delivery logged in server console)",
                "email", email,
                "emailDelivered", emailSent,
                "otpPreview", otpCode // provides helpful debug/demo preview
        ));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyPaymentOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otpCode = payload.get("otpCode");

        if (email == null || otpCode == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email and 6-digit OTP code are required."
            ));
        }

        boolean isValid = otpService.verifyOtp(email, otpCode);
        if (isValid) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "OTP verified successfully. Payment authorized."
            ));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", "Invalid or expired OTP code. Please check your email or request a new code."
            ));
        }
    }
}
