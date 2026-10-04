package com.skylineair.patterns.schedule;

import com.skylineair.model.Flight;

/**
 * Concrete Observer 2: Automatically updates seat capacity & cache when flight aircraft changes
 */
public class SeatInventorySyncObserver implements ScheduleObserver {

    @Override
    public void onScheduleUpdated(Flight flight, String changeType, String changeDetails) {
        System.out.println("[SeatInventorySyncObserver] Synchronizing seat inventory cache for flight: " 
                + flight.getFlightNumber() + " | Available Seats: " + flight.getAvailableSeats());
    }
}
