package com.skylineair.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "aircraft")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Aircraft {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long aircraftId;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false, unique = true)
    private String tailNumber;

    private Integer economySeats = 150;
    private Integer businessSeats = 30;
    private Integer firstClassSeats = 12;

    private String status = "ACTIVE";
}
