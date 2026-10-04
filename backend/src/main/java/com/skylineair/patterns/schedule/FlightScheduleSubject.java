package com.skylineair.patterns.schedule;

import com.skylineair.model.Flight;
import java.util.ArrayList;
import java.util.List;

/**
 * Subject / Observable class for Observer Pattern
 * Notifies all registered listeners whenever a flight schedule or status changes.
 */
public class FlightScheduleSubject {

    private final List<ScheduleObserver> observers = new ArrayList<>();

    public void attach(ScheduleObserver observer) {
        if (!observers.contains(observer)) {
            observers.add(observer);
        }
    }

    public void detach(ScheduleObserver observer) {
        observers.remove(observer);
    }

    public void notifyObservers(Flight flight, String changeType, String changeDetails) {
        for (ScheduleObserver obs : observers) {
            obs.onScheduleUpdated(flight, changeType, changeDetails);
        }
    }
}
