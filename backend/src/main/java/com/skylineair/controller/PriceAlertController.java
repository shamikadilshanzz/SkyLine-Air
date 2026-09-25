package com.skylineair.controller;

import com.skylineair.model.PriceAlert;
import com.skylineair.repository.PriceAlertRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/price-alerts")
@CrossOrigin
public class PriceAlertController {

    private final PriceAlertRepository priceAlertRepository;

    public PriceAlertController(PriceAlertRepository priceAlertRepository) {
        this.priceAlertRepository = priceAlertRepository;
    }

    @GetMapping
    public List<PriceAlert> getAllPriceAlerts() {
        return priceAlertRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PriceAlert> getPriceAlertById(@PathVariable Long id) {
        return priceAlertRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/email/{email}")
    public List<PriceAlert> getPriceAlertsByEmail(@PathVariable String email) {
        return priceAlertRepository.findByUserEmail(email);
    }

    @GetMapping("/user/{userId}")
    public List<PriceAlert> getPriceAlertsByUser(@PathVariable Long userId) {
        return priceAlertRepository.findByUserId(userId);
    }

    @PostMapping
    public ResponseEntity<PriceAlert> createPriceAlert(@RequestBody PriceAlert priceAlert) {
        if (priceAlert.getStatus() == null) {
            priceAlert.setStatus("ACTIVE");
        }
        if (priceAlert.getCreatedAt() == null) {
            priceAlert.setCreatedAt(java.time.LocalDateTime.now());
        }
        PriceAlert saved = priceAlertRepository.save(priceAlert);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PriceAlert> updatePriceAlert(@PathVariable Long id, @RequestBody PriceAlert details) {
        return priceAlertRepository.findById(id)
                .map(existing -> {
                    if (details.getTargetPrice() != null) existing.setTargetPrice(details.getTargetPrice());
                    if (details.getCabinClass() != null) existing.setCabinClass(details.getCabinClass());
                    if (details.getFrequency() != null) existing.setFrequency(details.getFrequency());
                    if (details.getStatus() != null) existing.setStatus(details.getStatus());
                    if (details.getUserEmail() != null) existing.setUserEmail(details.getUserEmail());
                    PriceAlert updated = priceAlertRepository.save(existing);
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePriceAlert(@PathVariable Long id) {
        if (priceAlertRepository.existsById(id)) {
            priceAlertRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
