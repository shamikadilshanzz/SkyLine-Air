package com.skylineair.patterns.hotel;

import com.skylineair.model.Hotel;

/**
 * FACTORY METHOD - HotelPackageFactory
 *
 * Encapsulates the instantiation logic for creating the appropriate
 * hotel package based on passenger flight layover duration and eligibility rules.
 */
public class HotelPackageFactory {

    public static HotelStayPackage createPackage(boolean hasLayover, Double layoverDurationHours, Hotel hotel) {
        if (!hasLayover || layoverDurationHours == null || hotel == null) {
            return new StandardStayPackage();
        }

        int threshold = hotel.getComplimentaryThresholdHours() != null ? hotel.getComplimentaryThresholdHours() : 8;

        if (layoverDurationHours >= threshold) {
            return new ComplimentaryLayoverPackage();
        } else if (layoverDurationHours >= 6.0) {
            return new DiscountedTransitPackage();
        } else {
            return new StandardStayPackage();
        }
    }
}
