package com.skylineair.controller;

import com.skylineair.model.Flight;
import com.skylineair.repository.FlightRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/flights")
@CrossOrigin
public class FlightController {

    private final FlightRepository flightRepository;

    public FlightController(FlightRepository flightRepository) {
        this.flightRepository = flightRepository;
    }

    @GetMapping
    public List<Flight> getAllFlights() {
        return flightRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Flight> getFlightById(@PathVariable Long id) {
        return flightRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<Flight> searchFlights(@RequestParam(required = false) String origin,
                                      @RequestParam(required = false) String destination) {
        if (origin != null && !origin.trim().isEmpty() && destination != null && !destination.trim().isEmpty()) {
            String orig = origin.trim().toUpperCase();
            String dest = destination.trim().toUpperCase();
            return flightRepository.findByOriginCodeAndDestinationCode(orig, dest);
        }
        return flightRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createFlight(@RequestBody Flight flight) {
        String validationError = validateFlight(flight);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(Map.of("message", validationError));
        }

        Optional<Flight> existing = flightRepository.findByFlightNumber(flight.getFlightNumber().trim().toUpperCase());
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Flight number '" + flight.getFlightNumber() + "' already exists"));
        }

        flight.setFlightNumber(flight.getFlightNumber().trim().toUpperCase());
        flight.setOriginCode(flight.getOriginCode().trim().toUpperCase());
        flight.setDestinationCode(flight.getDestinationCode().trim().toUpperCase());
        if (flight.getStatus() == null || flight.getStatus().trim().isEmpty()) {
            flight.setStatus("ON_TIME");
        }
        if ((flight.getDuration() == null || flight.getDuration().trim().isEmpty())
                && flight.getDepartureTime() != null && flight.getArrivalTime() != null) {
            long totalMinutes = java.time.Duration.between(flight.getDepartureTime(), flight.getArrivalTime()).toMinutes();
            if (totalMinutes > 0) {
                long hours = totalMinutes / 60;
                long minutes = totalMinutes % 60;
                flight.setDuration(String.format("%dh %02dm", hours, minutes));
            }
        }

        Flight savedFlight = flightRepository.save(flight);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedFlight);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateFlight(@PathVariable Long id, @RequestBody Flight updatedFlight) {
        return flightRepository.findById(id).map(existing -> {
            if (updatedFlight.getFlightNumber() != null && !updatedFlight.getFlightNumber().trim().isEmpty()) {
                String newFlightNum = updatedFlight.getFlightNumber().trim().toUpperCase();
                if (!newFlightNum.equalsIgnoreCase(existing.getFlightNumber())) {
                    Optional<Flight> duplicate = flightRepository.findByFlightNumber(newFlightNum);
                    if (duplicate.isPresent()) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Flight number '" + newFlightNum + "' is already assigned to another flight"));
                    }
                }
                existing.setFlightNumber(newFlightNum);
            }

            if (updatedFlight.getOriginCode() != null) existing.setOriginCode(updatedFlight.getOriginCode().trim().toUpperCase());
            if (updatedFlight.getDestinationCode() != null) existing.setDestinationCode(updatedFlight.getDestinationCode().trim().toUpperCase());
            
            if (existing.getOriginCode() != null && existing.getOriginCode().equalsIgnoreCase(existing.getDestinationCode())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Origin and Destination airport cannot be identical"));
            }

            if (updatedFlight.getOriginCity() != null) existing.setOriginCity(updatedFlight.getOriginCity());
            if (updatedFlight.getDestinationCity() != null) existing.setDestinationCity(updatedFlight.getDestinationCity());
            if (updatedFlight.getDepartureTime() != null) existing.setDepartureTime(updatedFlight.getDepartureTime());
            if (updatedFlight.getArrivalTime() != null) existing.setArrivalTime(updatedFlight.getArrivalTime());
            
            if (existing.getDepartureTime() != null && existing.getArrivalTime() != null && !existing.getArrivalTime().isAfter(existing.getDepartureTime())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Arrival time must be strictly after departure time"));
            }

            if (updatedFlight.getDuration() != null && !updatedFlight.getDuration().trim().isEmpty()) {
                existing.setDuration(updatedFlight.getDuration());
            } else if (existing.getDepartureTime() != null && existing.getArrivalTime() != null) {
                long totalMinutes = java.time.Duration.between(existing.getDepartureTime(), existing.getArrivalTime()).toMinutes();
                if (totalMinutes > 0) {
                    long hours = totalMinutes / 60;
                    long minutes = totalMinutes % 60;
                    existing.setDuration(String.format("%dh %02dm", hours, minutes));
                }
            }
            if (updatedFlight.getStops() != null) existing.setStops(updatedFlight.getStops());
            if (updatedFlight.getHasLayover() != null) existing.setHasLayover(updatedFlight.getHasLayover());
            if (updatedFlight.getLayoverAirport() != null) existing.setLayoverAirport(updatedFlight.getLayoverAirport());
            if (updatedFlight.getLayoverCity() != null) existing.setLayoverCity(updatedFlight.getLayoverCity());
            if (updatedFlight.getLayoverDurationHours() != null) existing.setLayoverDurationHours(updatedFlight.getLayoverDurationHours());
            if (updatedFlight.getAircraftId() != null) existing.setAircraftId(updatedFlight.getAircraftId());
            if (updatedFlight.getAircraftModel() != null) existing.setAircraftModel(updatedFlight.getAircraftModel());
            if (updatedFlight.getTailNumber() != null) existing.setTailNumber(updatedFlight.getTailNumber());
            if (updatedFlight.getBasePriceEconomy() != null) existing.setBasePriceEconomy(updatedFlight.getBasePriceEconomy());
            if (updatedFlight.getBasePriceBusiness() != null) existing.setBasePriceBusiness(updatedFlight.getBasePriceBusiness());
            if (updatedFlight.getBasePriceFirst() != null) existing.setBasePriceFirst(updatedFlight.getBasePriceFirst());
            if (updatedFlight.getTotalSeats() != null) existing.setTotalSeats(updatedFlight.getTotalSeats());
            if (updatedFlight.getAvailableSeats() != null) existing.setAvailableSeats(updatedFlight.getAvailableSeats());
            if (updatedFlight.getStatus() != null) existing.setStatus(updatedFlight.getStatus().trim().toUpperCase());
            if (updatedFlight.getImage() != null) existing.setImage(updatedFlight.getImage());

            Flight saved = flightRepository.save(existing);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    private String validateFlight(Flight flight) {
        if (flight.getFlightNumber() == null || flight.getFlightNumber().trim().isEmpty()) {
            return "Flight number is required (e.g. SL-204)";
        }
        if (flight.getOriginCode() == null || flight.getOriginCode().trim().isEmpty()) {
            return "Origin airport code is required";
        }
        if (flight.getDestinationCode() == null || flight.getDestinationCode().trim().isEmpty()) {
            return "Destination airport code is required";
        }
        if (flight.getOriginCode().trim().equalsIgnoreCase(flight.getDestinationCode().trim())) {
            return "Origin and destination airport cannot be identical";
        }
        if (flight.getDepartureTime() != null && flight.getArrivalTime() != null && !flight.getArrivalTime().isAfter(flight.getDepartureTime())) {
            return "Arrival time must be strictly after departure time";
        }
        if (flight.getBasePriceEconomy() != null && flight.getBasePriceEconomy().doubleValue() <= 0) {
            return "Economy price must be greater than 0";
        }
        if (flight.getTotalSeats() != null && flight.getTotalSeats() <= 0) {
            return "Total seats must be greater than 0";
        }
        return null;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFlight(@PathVariable Long id) {
        if (!flightRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        flightRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Flight deleted successfully", "id", id));
    }
}
