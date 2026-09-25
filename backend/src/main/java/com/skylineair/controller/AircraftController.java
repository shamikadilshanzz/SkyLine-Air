package com.skylineair.controller;

import com.skylineair.model.Aircraft;
import com.skylineair.repository.AircraftRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/aircraft")
@CrossOrigin
public class AircraftController {

    private final AircraftRepository aircraftRepository;

    public AircraftController(AircraftRepository aircraftRepository) {
        this.aircraftRepository = aircraftRepository;
    }

    @GetMapping
    public List<Aircraft> getAllAircraft() {
        return aircraftRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Aircraft> getAircraftById(@PathVariable Long id) {
        return aircraftRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Aircraft> createAircraft(@RequestBody Aircraft aircraft) {
        Aircraft saved = aircraftRepository.save(aircraft);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Aircraft> updateAircraft(@PathVariable Long id, @RequestBody Aircraft aircraftDetails) {
        return aircraftRepository.findById(id)
                .map(existing -> {
                    if (aircraftDetails.getModel() != null) existing.setModel(aircraftDetails.getModel());
                    if (aircraftDetails.getTailNumber() != null) existing.setTailNumber(aircraftDetails.getTailNumber());
                    if (aircraftDetails.getEconomySeats() != null) existing.setEconomySeats(aircraftDetails.getEconomySeats());
                    if (aircraftDetails.getBusinessSeats() != null) existing.setBusinessSeats(aircraftDetails.getBusinessSeats());
                    if (aircraftDetails.getFirstClassSeats() != null) existing.setFirstClassSeats(aircraftDetails.getFirstClassSeats());
                    if (aircraftDetails.getStatus() != null) existing.setStatus(aircraftDetails.getStatus());
                    Aircraft updated = aircraftRepository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAircraft(@PathVariable Long id) {
        if (aircraftRepository.existsById(id)) {
            aircraftRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
