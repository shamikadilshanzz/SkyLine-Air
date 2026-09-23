package com.skylineair.controller;

import com.skylineair.model.User;
import com.skylineair.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        if (email == null || password == null || email.trim().isEmpty() || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email address and password are required"));
        }

        String normalizedEmail = email.trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Validate password strictly
            if (password.equals(user.getPasswordHash())) {
                return ResponseEntity.ok(user);
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Invalid email address or password credentials"));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email address is required for registration"));
        }

        String normalizedEmail = user.getEmail().trim().toLowerCase();
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "An account with email address '" + normalizedEmail + "' already exists"));
        }

        user.setEmail(normalizedEmail);
        if (user.getPasswordHash() == null || user.getPasswordHash().isEmpty()) {
            user.setPasswordHash("default123");
        }

        if (user.getFullName() == null || user.getFullName().trim().isEmpty()) {
            user.setFullName((user.getFirstName() + " " + user.getLastName()).trim());
        }

        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User updatedUser) {
        return userRepository.findById(id).map(existingUser -> {
            if (updatedUser.getFullName() != null) existingUser.setFullName(updatedUser.getFullName());
            if (updatedUser.getPhoneNumber() != null) existingUser.setPhoneNumber(updatedUser.getPhoneNumber());
            if (updatedUser.getTitle() != null) existingUser.setTitle(updatedUser.getTitle());
            if (updatedUser.getFirstName() != null) existingUser.setFirstName(updatedUser.getFirstName());
            if (updatedUser.getLastName() != null) existingUser.setLastName(updatedUser.getLastName());
            if (updatedUser.getDob() != null) existingUser.setDob(updatedUser.getDob());
            if (updatedUser.getGender() != null) existingUser.setGender(updatedUser.getGender());
            if (updatedUser.getNationality() != null) existingUser.setNationality(updatedUser.getNationality());
            if (updatedUser.getPassportNumber() != null) existingUser.setPassportNumber(updatedUser.getPassportNumber());
            if (updatedUser.getPassportExpiry() != null) existingUser.setPassportExpiry(updatedUser.getPassportExpiry());
            if (updatedUser.getPassportIssuingCountry() != null) existingUser.setPassportIssuingCountry(updatedUser.getPassportIssuingCountry());
            if (updatedUser.getFrequentFlyerNumber() != null) existingUser.setFrequentFlyerNumber(updatedUser.getFrequentFlyerNumber());
            if (updatedUser.getLoyaltyPoints() != null) existingUser.setLoyaltyPoints(updatedUser.getLoyaltyPoints());
            if (updatedUser.getLoyaltyTier() != null) existingUser.setLoyaltyTier(updatedUser.getLoyaltyTier());
            if (updatedUser.getSeatPreference() != null) existingUser.setSeatPreference(updatedUser.getSeatPreference());
            if (updatedUser.getMealPreference() != null) existingUser.setMealPreference(updatedUser.getMealPreference());
            if (updatedUser.getAddress() != null) existingUser.setAddress(updatedUser.getAddress());
            if (updatedUser.getCity() != null) existingUser.setCity(updatedUser.getCity());
            if (updatedUser.getPostalCode() != null) existingUser.setPostalCode(updatedUser.getPostalCode());
            if (updatedUser.getCountry() != null) existingUser.setCountry(updatedUser.getCountry());
            if (updatedUser.getEmergencyContactName() != null) existingUser.setEmergencyContactName(updatedUser.getEmergencyContactName());
            if (updatedUser.getEmergencyContactPhone() != null) existingUser.setEmergencyContactPhone(updatedUser.getEmergencyContactPhone());
            if (updatedUser.getEmergencyContactRelationship() != null) existingUser.setEmergencyContactRelationship(updatedUser.getEmergencyContactRelationship());
            if (updatedUser.getEmergencyContactEmail() != null) existingUser.setEmergencyContactEmail(updatedUser.getEmergencyContactEmail());

            existingUser.setUpdatedAt(LocalDateTime.now());
            User saved = userRepository.save(existingUser);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }
}
