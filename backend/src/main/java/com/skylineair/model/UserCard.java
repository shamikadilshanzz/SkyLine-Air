package com.skylineair.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_cards")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cardId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String cardType;

    @Column(nullable = false)
    private String cardHolder;

    private String cardNumberMasked;

    @Column(nullable = false)
    private String last4;

    @Column(nullable = false)
    private String expiry;

    private String cvv;

    private Boolean isDefault = false;

    private LocalDateTime createdAt = LocalDateTime.now();
}
