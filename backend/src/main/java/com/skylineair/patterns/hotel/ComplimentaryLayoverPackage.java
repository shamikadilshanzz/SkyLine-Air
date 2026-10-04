package com.skylineair.patterns.hotel;

import com.skylineair.model.Hotel;
import java.math.BigDecimal;

/**
 * Concrete Product 1: 100% Free Complimentary Transit Hotel Stay (Layover >= 8 Hours)
 */
public class ComplimentaryLayoverPackage implements HotelStayPackage {

    @Override
    public BigDecimal calculateTotalCost(Hotel hotel, int nights) {
        return BigDecimal.ZERO; // $0 Free for passenger
    }

    @Override
    public boolean isComplimentary() {
        return true;
    }

    @Override
    public String getPackageCategory() {
        return "100% COMPLIMENTARY TRANSIT STAY";
    }

    @Override
    public String generateVoucherReference(String pnrCode) {
        return "HTV-FREE-" + (pnrCode != null ? pnrCode.replace("-", "") : "STAY") + "-" + (1000 + (int)(Math.random() * 9000));
    }
}
