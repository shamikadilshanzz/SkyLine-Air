package com.skylineair.patterns.search;

import com.skylineair.model.Flight;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Concrete Strategy 2: Earliest Departure Strategy
 */
public class EarliestDepartureStrategy implements FlightSortingStrategy {
    @Override
    public List<Flight> sort(List<Flight> flights) {
        List<Flight> sorted = new ArrayList<>(flights);
        sorted.sort(Comparator.comparing(f -> f.getDepartureTime() != null ? f.getDepartureTime().toString() : ""));
        return sorted;
    }
}
