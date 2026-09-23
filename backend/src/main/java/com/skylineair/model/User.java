package com.skylineair.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    private String phoneNumber;
    private String title;
    private String firstName;
    private String lastName;
    private String dob;
    private String gender;
    private String nationality;
    private String country;
    private String address;
    private String city;
    private String postalCode;

    // Role: PASSENGER, TICKETING_OFFICER, ADMIN, HOTEL_MANAGER
    private String role = "PASSENGER";

    // Travel Documents
    private String passportNumber;
    private String passportExpiry;
    private String passportIssuingCountry;

    // Loyalty & Rewards
    private String frequentFlyerNumber;
    private Integer loyaltyPoints = 1200;
    private String loyaltyTier = "Silver";

    // Preferences
    private String seatPreference = "Window";
    private String mealPreference = "Standard";

    // Emergency Contact
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelationship;
    private String emergencyContactEmail;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}
