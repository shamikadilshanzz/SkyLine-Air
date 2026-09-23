package com.skylineair.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "hotels")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Hotel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long hotelId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String airportCode;

    private String country;

    private Integer starRating = 4;
    private BigDecimal pricePerNight;
    private Integer complimentaryThresholdHours = 8;
    private Integer availableRooms = 30;
    private Double distanceKm = 1.0;
    private Boolean shuttleService = true;
    private String image;

    @Column(length = 500)
    private String amenities;
}
