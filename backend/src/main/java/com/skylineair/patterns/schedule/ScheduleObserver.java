package com.skylineair.patterns.schedule;

import com.skylineair.model.Flight;

/**
 * OBSERVER PATTERN - ScheduleObserver Interface
 * Member: ATHTHANAYAKA A B V K (IT25102905)
 * Module: Manage Flight Schedule
 *
 * Defines the update contract when flight schedules change.
 */
public interface ScheduleObserver {
    void onScheduleUpdated(Flight flight, String changeType, String changeDetails);
}
