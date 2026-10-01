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

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    private String phoneNumber;
    private String title = "Mr";

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
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

    /**
     * Composite Attribute: Full Name is dynamically derived from first_name and last_name.
     * Marked as @Transient so it is not stored as a redundant column in the relational database.
     */
    @Transient
    public String getFullName() {
        if (firstName != null && lastName != null && !firstName.trim().isEmpty() && !lastName.trim().isEmpty()) {
            return (firstName.trim() + " " + lastName.trim()).trim();
        }
        if (firstName != null && !firstName.trim().isEmpty()) return firstName.trim();
        if (lastName != null && !lastName.trim().isEmpty()) return lastName.trim();
        return "";
    }

    public void setFullName(String fullName) {
        if (fullName != null && !fullName.trim().isEmpty()) {
            String[] parts = fullName.trim().split("\\s+", 2);
            if (this.firstName == null || this.firstName.trim().isEmpty()) {
                this.firstName = parts[0];
            }
            if ((this.lastName == null || this.lastName.trim().isEmpty()) && parts.length > 1) {
                this.lastName = parts[1];
            }
        }
    }
}
