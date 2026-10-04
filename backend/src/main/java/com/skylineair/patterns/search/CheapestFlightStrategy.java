package com.skylineair.patterns.search;

import com.skylineair.model.Flight;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Concrete Strategy 1: Cheapest Flight Strategy
 */
public class CheapestFlightStrategy implements FlightSortingStrategy {
    @Override
    public List<Flight> sort(List<Flight> flights) {
        List<Flight> sorted = new ArrayList<>(flights);
        sorted.sort(Comparator.comparing(f -> f.getBasePriceEconomy() != null ? f.getBasePriceEconomy() : java.math.BigDecimal.ZERO));
        return sorted;
    }
}
