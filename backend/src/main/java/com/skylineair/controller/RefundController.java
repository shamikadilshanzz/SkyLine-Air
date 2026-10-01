package com.skylineair.controller;

import com.skylineair.model.RefundRequest;
import com.skylineair.repository.RefundRequestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/refunds")
@CrossOrigin
public class RefundController {

    private final RefundRequestRepository refundRequestRepository;
    private final com.skylineair.repository.ReservationRepository reservationRepository;
    private final com.skylineair.repository.FlightRepository flightRepository;

    public RefundController(RefundRequestRepository refundRequestRepository,
                            com.skylineair.repository.ReservationRepository reservationRepository,
                            com.skylineair.repository.FlightRepository flightRepository) {
        this.refundRequestRepository = refundRequestRepository;
        this.reservationRepository = reservationRepository;
        this.flightRepository = flightRepository;
    }

    @GetMapping
    public List<RefundRequest> getAllRefunds() {
        return refundRequestRepository.findAll();
    }

    @GetMapping("/user/{userEmail}")
    public List<RefundRequest> getRefundsByUserEmail(@PathVariable String userEmail) {
        return refundRequestRepository.findByUserEmail(userEmail);
    }

    @GetMapping("/pnr/{pnr}")
    public List<RefundRequest> getRefundsByPnr(@PathVariable String pnr) {
        return refundRequestRepository.findByPnr(pnr);
    }

    @PostMapping
    public ResponseEntity<?> createRefundRequest(@RequestBody RefundRequest refundRequest) {
        // Prevent duplicate refund requests for the same PNR
        if (refundRequest.getPnr() != null && !refundRequest.getPnr().trim().isEmpty()) {
            List<RefundRequest> existing = refundRequestRepository.findByPnr(refundRequest.getPnr().trim());
            if (!existing.isEmpty()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "message", "A refund request has already been submitted for booking PNR: " + refundRequest.getPnr(),
                        "refund", existing.get(0)
                ));
            }
        }

        if (refundRequest.getRefundReference() == null || refundRequest.getRefundReference().isEmpty()) {
            refundRequest.setRefundReference("RF-" + (10000 + new Random().nextInt(90000)));
        }

        refundRequest.setRequestedDate(LocalDateTime.now());
        if (refundRequest.getStatus() == null) {
            refundRequest.setStatus("UNDER_REVIEW");
        }

        // Update corresponding reservation booking status to CANCELLED and restore available seats
        if (refundRequest.getPnr() != null && !refundRequest.getPnr().trim().isEmpty()) {
            reservationRepository.findByPnrCode(refundRequest.getPnr().trim()).ifPresent(res -> {
                res.setBookingStatus("CANCELLED");
                reservationRepository.save(res);

                int passengerCount = (res.getPassengers() != null && !res.getPassengers().isEmpty()) ? res.getPassengers().size() : 1;
                if (res.getFlightNumber() != null && !res.getFlightNumber().trim().isEmpty()) {
                    flightRepository.findByFlightNumber(res.getFlightNumber().trim()).ifPresent(f -> {
                        int total = f.getTotalSeats() != null ? f.getTotalSeats() : 60;
                        int curr = f.getAvailableSeats() != null ? f.getAvailableSeats() : 0;
                        f.setAvailableSeats(Math.min(total, curr + passengerCount));
                        flightRepository.save(f);
                    });
                } else if (res.getFlightId() != null) {
                    flightRepository.findById(res.getFlightId()).ifPresent(f -> {
                        int total = f.getTotalSeats() != null ? f.getTotalSeats() : 60;
                        int curr = f.getAvailableSeats() != null ? f.getAvailableSeats() : 0;
                        f.setAvailableSeats(Math.min(total, curr + passengerCount));
                        flightRepository.save(f);
                    });
                }
            });
        }

        RefundRequest saved = refundRequestRepository.save(refundRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateRefundStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        return refundRequestRepository.findById(id).map(existing -> {
            if (newStatus != null) {
                existing.setStatus(newStatus);
                if ("APPROVED".equalsIgnoreCase(newStatus) || "PROCESSED".equalsIgnoreCase(newStatus)) {
                    existing.setProcessedAt(LocalDateTime.now());
                }
            }
            RefundRequest saved = refundRequestRepository.save(existing);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRefund(@PathVariable Long id) {
        if (!refundRequestRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        refundRequestRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Refund request deleted successfully", "id", id));
    }

    @DeleteMapping
    public ResponseEntity<?> clearAllRefunds() {
        long count = refundRequestRepository.count();
        refundRequestRepository.deleteAll();
        return ResponseEntity.ok(Map.of("message", "All refund requests cleared successfully", "clearedCount", count));
    }
}
