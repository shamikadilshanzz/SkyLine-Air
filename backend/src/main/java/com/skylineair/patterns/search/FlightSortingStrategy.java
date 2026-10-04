package com.skylineair.patterns.search;

import com.skylineair.model.Flight;
import java.util.List;

/**
 * STRATEGY PATTERN - Flight Sorting Strategy Interface
 * Member: SENEVIRATHNA R W (IT25103862)
 * Module: Search Flights and Check Availability
 */
public interface FlightSortingStrategy {
    List<Flight> sort(List<Flight> flights);
}
