package com.skylineair.patterns.hotel;

import com.skylineair.model.Hotel;
import java.math.BigDecimal;

/**
 * Concrete Product 3: Standard Independent Hotel Booking
 */
public class StandardStayPackage implements HotelStayPackage {

    @Override
    public BigDecimal calculateTotalCost(Hotel hotel, int nights) {
        BigDecimal base = hotel.getPricePerNight() != null ? hotel.getPricePerNight() : BigDecimal.valueOf(120);
        return base.multiply(BigDecimal.valueOf(Math.max(1, nights)));
    }

    @Override
    public boolean isComplimentary() {
        return false;
    }

    @Override
    public String getPackageCategory() {
        return "STANDARD INDEPENDENT STAY";
    }

    @Override
    public String generateVoucherReference(String pnrCode) {
        return "HTV-STD-" + (pnrCode != null ? pnrCode.replace("-", "") : "IND") + "-" + (1000 + (int)(Math.random() * 9000));
    }
}
