package com.skylineair.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    // 5 minutes expiry duration
    private static final long OTP_VALIDITY_SECONDS = 5 * 60;

    private static class OtpEntry {
        final String code;
        final Instant expiresAt;

        OtpEntry(String code, Instant expiresAt) {
            this.code = code;
            this.expiresAt = expiresAt;
        }

        boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    private final Map<String, OtpEntry> otpStorage = new ConcurrentHashMap<>();
    private final Random random = new Random();

    /**
     * Generate and store a new 6-digit OTP for the given email
     */
    public String generateOtp(String email) {
        if (email == null || email.trim().isEmpty()) {
            email = "passenger@skylineair.com";
        }
        String normalizedEmail = email.trim().toLowerCase();

        // 6-digit code between 100000 and 999999
        int number = 100000 + random.nextInt(900000);
        String code = String.valueOf(number);

        Instant expiresAt = Instant.now().plusSeconds(OTP_VALIDITY_SECONDS);
        otpStorage.put(normalizedEmail, new OtpEntry(code, expiresAt));

        return code;
    }

    /**
     * Verify the input OTP against stored record
     */
    public boolean verifyOtp(String email, String inputCode) {
        if (email == null || inputCode == null) {
            return false;
        }
        String normalizedEmail = email.trim().toLowerCase();
        String cleanInput = inputCode.trim();

        OtpEntry entry = otpStorage.get(normalizedEmail);
        if (entry == null) {
            return false;
        }

        if (entry.isExpired()) {
            otpStorage.remove(normalizedEmail);
            return false;
        }

        if (entry.code.equals(cleanInput)) {
            // Once verified successfully, consume/remove the OTP
            otpStorage.remove(normalizedEmail);
            return true;
        }

        return false;
    }

    /**
     * Get active OTP code if not expired (used for testing / logs)
     */
    public String getActiveOtp(String email) {
        if (email == null) return null;
        String normalizedEmail = email.trim().toLowerCase();
        OtpEntry entry = otpStorage.get(normalizedEmail);
        if (entry != null && !entry.isExpired()) {
            return entry.code;
        }
        return null;
    }

    /**
     * Clear OTP for email
     */
    public void clearOtp(String email) {
        if (email != null) {
            otpStorage.remove(email.trim().toLowerCase());
        }
    }
}
