package com.skylineair.patterns.hotel;

import com.skylineair.model.Hotel;
import java.math.BigDecimal;

/**
 * FACTORY METHOD PATTERN - HotelStayPackage Interface
 * Member: KUMARA H W S D (IT25102340)
 * Module: Book Layover Hotel Accommodation
 *
 * Encapsulates the qualification, pricing, and voucher generation for hotel packages.
 */
public interface HotelStayPackage {
    BigDecimal calculateTotalCost(Hotel hotel, int nights);
    boolean isComplimentary();
    String getPackageCategory();
    String generateVoucherReference(String pnrCode);
}
