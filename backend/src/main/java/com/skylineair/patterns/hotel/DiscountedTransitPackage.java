package com.skylineair.patterns.hotel;

import com.skylineair.model.Hotel;
import java.math.BigDecimal;

/**
 * Concrete Product 2: Discounted Airline Transit Rate (Layover 6 to 8 Hours)
 */
public class DiscountedTransitPackage implements HotelStayPackage {

    @Override
    public BigDecimal calculateTotalCost(Hotel hotel, int nights) {
        BigDecimal base = hotel.getPricePerNight() != null ? hotel.getPricePerNight() : BigDecimal.valueOf(120);
        BigDecimal discountedNightly = base.multiply(BigDecimal.valueOf(0.80)); // 20% airline discount
        return discountedNightly.multiply(BigDecimal.valueOf(Math.max(1, nights)));
    }

    @Override
    public boolean isComplimentary() {
        return false;
    }

    @Override
    public String getPackageCategory() {
        return "DISCOUNTED AIRLINE TRANSIT STAY";
    }

    @Override
    public String generateVoucherReference(String pnrCode) {
        return "HTV-DISC-" + (pnrCode != null ? pnrCode.replace("-", "") : "STAY") + "-" + (1000 + (int)(Math.random() * 9000));
    }
}
