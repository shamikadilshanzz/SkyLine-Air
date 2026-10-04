package com.skylineair.patterns.payment;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Concrete Processor 1: Credit & Debit Card Payment Processor
 */
public class CreditCardPaymentProcessor implements PaymentProcessor {

    @Override
    public Map<String, Object> processPayment(String pnr, BigDecimal amount, Map<String, String> paymentDetails) {
        String cardNumber = paymentDetails.getOrDefault("cardNumber", "");
        String cvv = paymentDetails.getOrDefault("cvv", "");

        if (cardNumber.replaceAll("\\D", "").length() < 13 || cvv.length() < 3) {
            return Map.of("success", false, "message", "Invalid card credentials or CVV security code.");
        }

        String txnRef = "TXN-CC-" + System.currentTimeMillis();
        return Map.of(
                "success", true,
                "status", "PAID",
                "transactionReference", txnRef,
                "amount", amount,
                "paymentMethod", "CREDIT_CARD",
                "message", "Credit Card Payment Authorized Successfully via 3D Secure."
        );
    }

    @Override
    public String getPaymentMethodName() {
        return "CARD";
    }
}
