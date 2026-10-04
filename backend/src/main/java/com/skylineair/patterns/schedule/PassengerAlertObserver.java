package com.skylineair.patterns.schedule;

import com.skylineair.model.Flight;

/**
 * Concrete Observer 1: Broadcasts Schedule changes & delays to passengers
 */
public class PassengerAlertObserver implements ScheduleObserver {

    @Override
    public void onScheduleUpdated(Flight flight, String changeType, String changeDetails) {
        System.out.println("[PassengerAlertObserver] DISPATCHING NOTIFICATION to passengers on flight " 
                + flight.getFlightNumber() + " | Action: " + changeType + " | Info: " + changeDetails);
    }
}
