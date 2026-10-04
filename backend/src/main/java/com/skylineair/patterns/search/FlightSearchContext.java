package com.skylineair.patterns.search;

import com.skylineair.model.Flight;
import java.util.List;

/**
 * Context Class for Strategy Pattern
 * Allows switching search & sorting algorithms dynamically at runtime.
 */
public class FlightSearchContext {

    private FlightSortingStrategy strategy;

    public FlightSearchContext(FlightSortingStrategy strategy) {
        this.strategy = strategy;
    }

    public void setStrategy(FlightSortingStrategy strategy) {
        this.strategy = strategy;
    }

    public List<Flight> executeSort(List<Flight> flights) {
        if (strategy == null || flights == null) {
            return flights;
        }
        return strategy.sort(flights);
    }
}
