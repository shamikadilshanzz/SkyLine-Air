package com.skylineair.controller;

import com.skylineair.model.UserCard;
import com.skylineair.repository.UserCardRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cards")
@CrossOrigin
public class UserCardController {

    private final UserCardRepository userCardRepository;

    public UserCardController(UserCardRepository userCardRepository) {
        this.userCardRepository = userCardRepository;
    }

    @GetMapping("/user/{userId}")
    public List<UserCard> getCardsByUser(@PathVariable Long userId) {
        if (userId == null) {
            return List.of();
        }
        return userCardRepository.findByUserId(userId);
    }

    @PostMapping
    public ResponseEntity<?> saveCard(@RequestBody UserCard card) {
        if (card.getUserId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "userId is required to save a card"));
        }

        if (card.getCardHolder() == null || card.getCardHolder().isEmpty()) {
            card.setCardHolder("Card Holder");
        }

        if (card.getExpiry() == null || card.getExpiry().isEmpty()) {
            card.setExpiry("12/28");
        }

        if (card.getCardType() == null || card.getCardType().isEmpty()) {
            card.setCardType("Visa");
        }

        if (card.getLast4() == null || card.getLast4().isEmpty()) {
            card.setLast4("0000");
        }

        if (card.getCardNumberMasked() == null || card.getCardNumberMasked().isEmpty()) {
            card.setCardNumberMasked("•••• •••• •••• " + card.getLast4());
        }

        // If this is the user's first card, mark as default automatically
        List<UserCard> existing = userCardRepository.findByUserId(card.getUserId());
        if (existing.isEmpty()) {
            card.setIsDefault(true);
        } else if (Boolean.TRUE.equals(card.getIsDefault())) {
            // Reset existing defaults
            existing.forEach(c -> {
                c.setIsDefault(false);
                userCardRepository.save(c);
            });
        }

        card.setCreatedAt(LocalDateTime.now());
        UserCard saved = userCardRepository.save(card);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{cardId}/default")
    public ResponseEntity<?> setDefaultCard(@PathVariable Long cardId, @RequestBody Map<String, Long> body) {
        Long userId = body.get("userId");
        return userCardRepository.findById(cardId).map(card -> {
            if (userId != null) {
                List<UserCard> userCards = userCardRepository.findByUserId(userId);
                userCards.forEach(c -> {
                    c.setIsDefault(c.getCardId().equals(cardId));
                    userCardRepository.save(c);
                });
            } else {
                card.setIsDefault(true);
                userCardRepository.save(card);
            }
            return ResponseEntity.ok(Map.of("message", "Default card updated successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{cardId}")
    public ResponseEntity<?> deleteCard(@PathVariable Long cardId) {
        if (!userCardRepository.existsById(cardId)) {
            return ResponseEntity.notFound().build();
        }
        userCardRepository.deleteById(cardId);
        return ResponseEntity.ok(Map.of("message", "Card removed successfully", "cardId", cardId));
    }
}
