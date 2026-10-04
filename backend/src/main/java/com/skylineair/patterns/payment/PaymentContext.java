package com.skylineair.patterns.payment;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * PaymentContext to route payments to the appropriate Strategy / Adapter
 */
public class PaymentContext {

    private final Map<String, PaymentProcessor> processors = new HashMap<>();

    public PaymentContext() {
        // Register default processors
        registerProcessor("CARD", new CreditCardPaymentProcessor());
        registerProcessor("E-WALLET", new PayPalEWalletAdapter());
        registerProcessor("PAYPAL", new PayPalEWalletAdapter());
    }

    public void registerProcessor(String method, PaymentProcessor processor) {
        processors.put(method.toUpperCase(), processor);
    }

    public Map<String, Object> executePayment(String method, String pnr, BigDecimal amount, Map<String, String> details) {
        PaymentProcessor processor = processors.get(method.toUpperCase());
        if (processor == null) {
            processor = processors.get("CARD");
        }
        return processor.processPayment(pnr, amount, details);
    }
}
