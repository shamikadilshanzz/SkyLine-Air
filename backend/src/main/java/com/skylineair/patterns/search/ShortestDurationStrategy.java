package com.skylineair.patterns.search;

import com.skylineair.model.Flight;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Concrete Strategy 3: Shortest Duration Strategy
 */
public class ShortestDurationStrategy implements FlightSortingStrategy {

    private int parseDurationMinutes(String duration) {
        if (duration == null || duration.isEmpty()) return 0;
        int minutes = 0;
        try {
            if (duration.contains("h")) {
                String[] parts = duration.split("h");
                minutes += Integer.parseInt(parts[0].trim()) * 60;
                if (parts.length > 1 && parts[1].contains("m")) {
                    minutes += Integer.parseInt(parts[1].replace("m", "").trim());
                }
            }
        } catch (Exception ignored) {}
        return minutes;
    }

    @Override
    public List<Flight> sort(List<Flight> flights) {
        List<Flight> sorted = new ArrayList<>(flights);
        sorted.sort(Comparator.comparingInt(f -> parseDurationMinutes(f.getDuration())));
        return sorted;
    }
}
