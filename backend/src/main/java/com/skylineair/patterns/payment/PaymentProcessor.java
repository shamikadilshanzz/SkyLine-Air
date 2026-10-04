package com.skylineair.patterns.payment;

import java.math.BigDecimal;
import java.util.Map;

/**
 * ADAPTER & STRATEGY PATTERN - PaymentProcessor Interface
 * Member: HIRUSHIKA A P N (IT25103866)
 * Module: Process Online Payment
 */
public interface PaymentProcessor {
    Map<String, Object> processPayment(String pnr, BigDecimal amount, Map<String, String> paymentDetails);
    String getPaymentMethodName();
}
