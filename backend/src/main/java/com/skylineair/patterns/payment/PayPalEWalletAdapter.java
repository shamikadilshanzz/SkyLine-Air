package com.skylineair.patterns.payment;

import java.math.BigDecimal;
import java.util.Map;

/**
 * ADAPTER PATTERN - Adapts 3rd-Party E-Wallet (e.g. PayPal / ApplePay) API
 * to the standardized internal PaymentProcessor interface.
 */
public class PayPalEWalletAdapter implements PaymentProcessor {

    // Simulating external vendor SDK
    private final ThirdPartyEWalletService thirdPartyWalletService = new ThirdPartyEWalletService();

    @Override
    public Map<String, Object> processPayment(String pnr, BigDecimal amount, Map<String, String> paymentDetails) {
        String walletEmail = paymentDetails.getOrDefault("email", "passenger@skyline.com");
        
        // Translate internal request to external 3rd-party API format
        boolean authSuccess = thirdPartyWalletService.authenticateAndCharge(walletEmail, amount.doubleValue());
        
        if (!authSuccess) {
            return Map.of("success", false, "message", "E-Wallet authorization failed or insufficient balance.");
        }

        String txnRef = "TXN-WAL-" + System.currentTimeMillis();
        return Map.of(
                "success", true,
                "status", "PAID",
                "transactionReference", txnRef,
                "amount", amount,
                "paymentMethod", "E_WALLET",
                "message", "E-Wallet checkout completed successfully."
        );
    }

    @Override
    public String getPaymentMethodName() {
        return "E-WALLET";
    }

    // Inner vendor simulation class
    static class ThirdPartyEWalletService {
        boolean authenticateAndCharge(String walletEmail, double amount) {
            return walletEmail != null && walletEmail.contains("@") && amount > 0;
        }
    }
}
