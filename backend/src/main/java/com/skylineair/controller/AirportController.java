package com.skylineair.controller;

import com.skylineair.model.Airport;
import com.skylineair.repository.AirportRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/airports")
@CrossOrigin
public class AirportController {

    private final AirportRepository airportRepository;

    public AirportController(AirportRepository airportRepository) {
        this.airportRepository = airportRepository;
    }

    @GetMapping
    public List<Airport> getAllAirports() {
        return airportRepository.findAll();
    }

    @GetMapping("/{code}")
    public ResponseEntity<Airport> getAirportByCode(@PathVariable String code) {
        String cleanCode = code.trim().toUpperCase();
        return airportRepository.findById(cleanCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Airport> createAirport(@RequestBody Airport airport) {
        if (airport.getAirportCode() != null) {
            airport.setAirportCode(airport.getAirportCode().toUpperCase().trim());
        }
        Airport saved = airportRepository.save(airport);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{code}")
    public ResponseEntity<Airport> updateAirport(@PathVariable String code, @RequestBody Airport airportDetails) {
        String cleanCode = code.trim().toUpperCase();
        return airportRepository.findById(cleanCode)
                .map(existingAirport -> {
                    if (airportDetails.getAirportName() != null) existingAirport.setAirportName(airportDetails.getAirportName());
                    if (airportDetails.getCity() != null) existingAirport.setCity(airportDetails.getCity());
                    if (airportDetails.getCountry() != null) existingAirport.setCountry(airportDetails.getCountry());
                    Airport updated = airportRepository.save(existingAirport);
                    return ResponseEntity.ok(updated);
                })
                .orElseGet(() -> {
                    Airport newAirport = new Airport();
                    newAirport.setAirportCode(cleanCode);
                    newAirport.setAirportName(airportDetails.getAirportName() != null ? airportDetails.getAirportName() : cleanCode);
                    newAirport.setCity(airportDetails.getCity() != null ? airportDetails.getCity() : "");
                    newAirport.setCountry(airportDetails.getCountry() != null ? airportDetails.getCountry() : "");
                    Airport saved = airportRepository.save(newAirport);
                    return ResponseEntity.ok(saved);
                });
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<Void> deleteAirport(@PathVariable String code) {
        String cleanCode = code.trim().toUpperCase();
        if (airportRepository.existsById(cleanCode)) {
            airportRepository.deleteById(cleanCode);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
