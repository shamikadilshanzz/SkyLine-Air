-- ============================================================================
-- SLIIT IT2140 : Database Design and Development (Assignment 01 - Part 02)
-- Project: SkyLine Air - Advanced SQL Scripts
-- Target DBMS: Microsoft SQL Server (SSMS / T-SQL Dialect)
-- Structure:
--   PART A: ISA Hierarchy Mapping Justification
--   PART D: SQL Queries & Outputs (5 Core Queries)
--   PART E: Stored Procedures / Functions (Complete for all 6 Members)
--   PART F: Database Triggers (Complete for all 6 Members)
-- ============================================================================

-- ============================================================================
-- PART A: ISA HIERARCHY MAPPING JUSTIFICATION (Documentation)
-- ============================================================================
/*
In our EER model, USER is a superclass entity with four disjoint subtypes:
  1. PASSENGER (has frequent_flyer_number, loyalty_points, preferences)
  2. TICKETING_OFFICER (manages reservations and passenger records)
  3. AIRLINE_ADMINISTRATOR (manages fleet, flights, and system configurations)
  4. HOTEL_MANAGER (manages partner hotel inventory and transit bookings)

Mapping Choice: Single-Table (Union) Inheritance Strategy
Reason for Choice:
  - All four subtypes share approximately 80% of common attributes (user_id, email,
    password_hash, first_name, last_name, phone, address, nationality, passport info).
  - Authentication and login require querying only a single table (dbo.users) using email 
    and password without executing expensive multi-table JOINs or UNION queries.
  - Role-based authorization is straightforwardly managed using a single `role` discriminator column.
*/

-- ============================================================================
-- PART D: SQL QUERIES & OUTPUTS (20%)
-- ============================================================================

-- Query 1: Simple SELECT with Filtering and Sorting
-- Purpose: Retrieve all active Boeing and Airbus aircraft with more than 200 economy seats
SELECT aircraft_id, model, tail_number, economy_seats, business_seats, status 
FROM dbo.aircraft 
WHERE economy_seats >= 200 AND status = 'ACTIVE' 
ORDER BY economy_seats DESC;

-- Query 2: Multi-Table INNER JOIN
-- Purpose: Fetch comprehensive flight booking details including user name, flight number, route, and cabin class
SELECT 
    r.pnr_code,
    u.first_name,
    u.last_name,
    u.email,
    f.flight_number,
    f.origin_code,
    f.destination_code,
    r.cabin_class,
    r.total_amount,
    r.booking_status
FROM dbo.reservations r
INNER JOIN dbo.users u ON r.user_id = u.user_id
INNER JOIN dbo.flights f ON r.flight_id = f.flight_id
ORDER BY r.booking_date DESC;

-- Query 3: Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)
-- Purpose: Calculate overall airline revenue metrics and average ticket fare from confirmed bookings
SELECT 
    COUNT(reservation_id) AS total_confirmed_bookings,
    SUM(total_amount) AS total_revenue,
    AVG(total_amount) AS average_ticket_fare,
    MIN(total_amount) AS lowest_fare_booked,
    MAX(total_amount) AS highest_fare_booked
FROM dbo.reservations
WHERE booking_status = 'CONFIRMED';

-- Query 4: GROUP BY with HAVING Clause
-- Purpose: Find partner hotels that have handled transit bookings and calculate total hotel revenue
SELECT 
    h.hotel_id,
    h.name AS hotel_name,
    h.city,
    COUNT(hb.hotel_booking_id) AS total_bookings_count,
    SUM(hb.amount) AS total_revenue_generated
FROM dbo.hotels h
INNER JOIN dbo.hotel_bookings hb ON h.hotel_id = hb.hotel_id
GROUP BY h.hotel_id, h.name, h.city
HAVING COUNT(hb.hotel_booking_id) >= 1
ORDER BY total_revenue_generated DESC;

-- Query 5: Subquery (Scalar & IN Subquery)
-- Purpose: Identify users whose total flight spending exceeds the average spending of all users
SELECT 
    u.user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.loyalty_tier,
    (SELECT SUM(r.total_amount) FROM dbo.reservations r WHERE r.user_id = u.user_id) AS total_spent
FROM dbo.users u
WHERE u.user_id IN (
    SELECT r.user_id 
    FROM dbo.reservations r 
    GROUP BY r.user_id 
    HAVING SUM(r.total_amount) > (SELECT AVG(total_amount) FROM dbo.reservations)
);
GO


-- ============================================================================
-- ============================================================================
-- PART E: STORED PROCEDURES / FUNCTIONS (15%) - ALL 6 GROUP MEMBERS
-- ============================================================================
-- ============================================================================

-- ----------------------------------------------------------------------------
-- MEMBER 1: SEARCH FLIGHT MODULE
-- Stored Function: fn_CalculateDynamicFare
-- Purpose: Calculates real-time dynamic flight pricing based on cabin class and seat scarcity surge
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.fn_CalculateDynamicFare', 'FN') IS NOT NULL
    DROP FUNCTION dbo.fn_CalculateDynamicFare;
GO

CREATE FUNCTION dbo.fn_CalculateDynamicFare(
    @p_flight_id INT,
    @p_cabin_class VARCHAR(30)
)
RETURNS DECIMAL(10, 2)
AS
BEGIN
    DECLARE @v_base_price DECIMAL(10, 2);
    DECLARE @v_avail_seats INT;
    DECLARE @v_total_seats INT;
    DECLARE @v_final_price DECIMAL(10, 2);

    -- Get base fare and seat inventory
    SELECT 
        @v_base_price = CASE 
            WHEN UPPER(@p_cabin_class) = 'BUSINESS' THEN base_price_business
            WHEN UPPER(@p_cabin_class) = 'FIRST' THEN base_price_first
            ELSE base_price_economy
        END,
        @v_avail_seats = available_seats,
        @v_total_seats = total_seats
    FROM dbo.flights
    WHERE flight_id = @p_flight_id;

    -- Dynamic surge pricing: If less than 20% seats remaining, apply 25% surge
    IF @v_total_seats > 0 AND (@v_avail_seats * 1.0 / @v_total_seats) <= 0.20
        SET @v_final_price = @v_base_price * 1.25;
    ELSE
        SET @v_final_price = @v_base_price;

    RETURN ISNULL(@v_final_price, 0.00);
END;
GO

-- Member 1 Execution & Test:
-- SELECT flight_id, flight_number, base_price_economy,
--        dbo.fn_CalculateDynamicFare(flight_id, 'ECONOMY') AS dynamic_economy_price,
--        dbo.fn_CalculateDynamicFare(flight_id, 'BUSINESS') AS dynamic_business_price
-- FROM dbo.flights;
-- GO


-- ----------------------------------------------------------------------------
-- MEMBER 2: RESERVATIONS MODULE
-- Stored Procedure: sp_CreateFlightReservation
-- Purpose: Creates a new booking record, auto-generates PNR, and computes total price
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_CreateFlightReservation', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_CreateFlightReservation;
GO

CREATE PROCEDURE dbo.sp_CreateFlightReservation
    @p_user_id INT,
    @p_flight_id INT,
    @p_cabin_class VARCHAR(30),
    @p_passenger_count INT,
    @p_contact_email VARCHAR(100),
    @p_new_pnr VARCHAR(10) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @v_unit_price DECIMAL(10, 2);
    DECLARE @v_total_fare DECIMAL(10, 2);
    DECLARE @v_flight_num VARCHAR(10);
    DECLARE @v_origin VARCHAR(50);
    DECLARE @v_destination VARCHAR(50);
    DECLARE @v_dep_time VARCHAR(50);
    DECLARE @v_user_name VARCHAR(100);

    -- Retrieve user details
    SELECT @v_user_name = CONCAT(first_name, ' ', last_name)
    FROM dbo.users WHERE user_id = @p_user_id;

    -- Retrieve flight details
    SELECT @v_flight_num = flight_number,
           @v_origin = origin_city,
           @v_destination = destination_city,
           @v_dep_time = CONVERT(VARCHAR(50), departure_time, 120),
           @v_unit_price = CASE 
               WHEN UPPER(@p_cabin_class) = 'BUSINESS' THEN base_price_business
               WHEN UPPER(@p_cabin_class) = 'FIRST' THEN base_price_first
               ELSE base_price_economy
           END
    FROM dbo.flights WHERE flight_id = @p_flight_id;

    -- Generate random 6-character PNR (e.g. SK8492)
    SET @p_new_pnr = CONCAT('SK', CAST(ABS(CHECKSUM(NEWID())) % 9000 + 1000 AS VARCHAR(4)));
    SET @v_total_fare = @v_unit_price * @p_passenger_count;

    -- Insert reservation
    INSERT INTO dbo.reservations (
        pnr_code, user_id, user_name, user_email, flight_id, flight_number,
        origin, destination, departure_time, cabin_class, total_amount,
        booking_status, payment_status
    )
    VALUES (
        @p_new_pnr, @p_user_id, @v_user_name, @p_contact_email, @p_flight_id, @v_flight_num,
        @v_origin, @v_destination, @v_dep_time, @p_cabin_class, @v_total_fare,
        'PENDING_PAYMENT', 'PENDING'
    );

    SELECT @p_new_pnr AS generated_pnr, @v_total_fare AS total_booking_amount;
END;
GO

-- Member 2 Execution & Test:
-- DECLARE @out_pnr VARCHAR(10);
-- EXEC dbo.sp_CreateFlightReservation 
--     @p_user_id = 1, 
--     @p_flight_id = 1, 
--     @p_cabin_class = 'ECONOMY', 
--     @p_passenger_count = 2, 
--     @p_contact_email = 'shamikadilshan@gmail.com', 
--     @p_new_pnr = @out_pnr OUTPUT;
-- GO


-- ----------------------------------------------------------------------------
-- MEMBER 3: ONLINE PAYMENT MODULE
-- Stored Procedure: sp_ProcessOnlineCardPayment
-- Purpose: Records payment transaction, updates reservation status to PAID & CONFIRMED
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_ProcessOnlineCardPayment', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ProcessOnlineCardPayment;
GO

CREATE PROCEDURE dbo.sp_ProcessOnlineCardPayment
    @p_reservation_id INT,
    @p_payment_method VARCHAR(30),
    @p_amount DECIMAL(10, 2)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @v_txn_ref VARCHAR(50);
    SET @v_txn_ref = CONCAT('TXN-', CAST(ABS(CHECKSUM(NEWID())) % 900000 + 100000 AS VARCHAR(6)));

    -- 1. Insert payment record
    INSERT INTO dbo.payments (reservation_id, transaction_reference, payment_method, amount, payment_status)
    VALUES (@p_reservation_id, @v_txn_ref, @p_payment_method, @p_amount, 'SUCCESS');

    -- 2. Update reservation payment and booking status
    UPDATE dbo.reservations
    SET booking_status = 'CONFIRMED',
        payment_status = 'PAID',
        payment_method = @p_payment_method,
        transaction_ref = @v_txn_ref
    WHERE reservation_id = @p_reservation_id;

    SELECT @v_txn_ref AS transaction_reference, 'SUCCESS' AS transaction_status, @p_amount AS amount_paid;
END;
GO

-- Member 3 Execution & Test:
-- EXEC dbo.sp_ProcessOnlineCardPayment @p_reservation_id = 1, @p_payment_method = 'CREDIT_CARD', @p_amount = 700.00;
-- GO


-- ----------------------------------------------------------------------------
-- MEMBER 4: CANCEL TICKET AND REFUND MODULE
-- Stored Procedure: sp_ProcessTicketRefund
-- Purpose: Calculates cancellation penalty, marks reservation CANCELLED, and processes refund
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_ProcessTicketRefund', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_ProcessTicketRefund;
GO

CREATE PROCEDURE dbo.sp_ProcessTicketRefund
    @in_refund_id INT,
    @in_admin_decision VARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @v_res_id INT;
    DECLARE @v_refund_amt DECIMAL(10, 2);

    -- Retrieve reservation ID and refund amount
    SELECT @v_res_id = reservation_id, @v_refund_amt = refund_amount 
    FROM dbo.refund_requests 
    WHERE refund_id = @in_refund_id;

    IF @in_admin_decision = 'APPROVED'
    BEGIN
        -- Update refund request status
        UPDATE dbo.refund_requests 
        SET status = 'APPROVED', processed_at = SYSDATETIME() 
        WHERE refund_id = @in_refund_id;

        -- Update reservation booking status
        UPDATE dbo.reservations 
        SET booking_status = 'CANCELLED', payment_status = 'REFUNDED' 
        WHERE reservation_id = @v_res_id;
    END
    ELSE
    BEGIN
        -- Mark refund as rejected
        UPDATE dbo.refund_requests 
        SET status = 'REJECTED', processed_at = SYSDATETIME() 
        WHERE refund_id = @in_refund_id;
    END

    -- Return the updated refund record as a visible Result Grid for reports
    SELECT 
        refund_id,
        refund_reference,
        pnr,
        user_name,
        original_fare,
        cancellation_fee,
        refund_amount,
        status AS refund_status,
        processed_at
    FROM dbo.refund_requests
    WHERE refund_id = @in_refund_id;
END;
GO

-- Member 4 Execution & Test:
-- EXEC dbo.sp_ProcessTicketRefund @in_refund_id = 3, @in_admin_decision = 'APPROVED';
-- GO


-- ----------------------------------------------------------------------------
-- MEMBER 5: MANAGE FLIGHT SCHEDULE MODULE
-- Stored Procedure: sp_UpdateFlightScheduleStatus
-- Purpose: Updates departure/arrival times, schedule status (DELAYED/ON_TIME) and seat capacity
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_UpdateFlightScheduleStatus', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_UpdateFlightScheduleStatus;
GO

CREATE PROCEDURE dbo.sp_UpdateFlightScheduleStatus
    @p_flight_id INT,
    @p_new_departure DATETIME2,
    @p_new_arrival DATETIME2,
    @p_new_status VARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;

    -- Update flight schedule
    UPDATE dbo.flights
    SET departure_time = @p_new_departure,
        arrival_time = @p_new_arrival,
        status = @p_new_status
    WHERE flight_id = @p_flight_id;

    SELECT flight_id, flight_number, departure_time, arrival_time, status 
    FROM dbo.flights 
    WHERE flight_id = @p_flight_id;
END;
GO

-- Member 5 Execution & Test:
-- EXEC dbo.sp_UpdateFlightScheduleStatus 
--     @p_flight_id = 1, 
--     @p_new_departure = '2026-10-10 14:00:00', 
--     @p_new_arrival = '2026-10-10 18:30:00', 
--     @p_new_status = 'DELAYED';
-- GO


-- ----------------------------------------------------------------------------
-- MEMBER 6: BOOK LAYOVER HOTEL ACCOMMODATION MODULE
-- Stored Procedure: sp_BookLayoverTransitHotel
-- Purpose: Validates layover duration; if layover >= 8 hrs, grants complimentary stay ($0.00), else standard rate
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.sp_BookLayoverTransitHotel', 'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_BookLayoverTransitHotel;
GO

CREATE PROCEDURE dbo.sp_BookLayoverTransitHotel
    @p_reservation_id INT,
    @p_hotel_id INT,
    @p_room_type VARCHAR(50),
    @p_check_in DATE,
    @p_check_out DATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @v_user_id INT;
    DECLARE @v_guest_email VARCHAR(100);
    DECLARE @v_passenger_name VARCHAR(100);
    DECLARE @v_pnr VARCHAR(20);
    DECLARE @v_layover_hours FLOAT;
    DECLARE @v_hotel_name VARCHAR(100);
    DECLARE @v_price_per_night DECIMAL(10, 2);
    DECLARE @v_threshold INT;
    DECLARE @v_is_complimentary BIT;
    DECLARE @v_final_hotel_price DECIMAL(10, 2);
    DECLARE @v_voucher VARCHAR(30);

    -- Retrieve reservation info
    SELECT @v_user_id = user_id, @v_guest_email = user_email, @v_passenger_name = user_name,
           @v_pnr = pnr_code, @v_layover_hours = layover_duration_hours
    FROM dbo.reservations WHERE reservation_id = @p_reservation_id;

    -- Retrieve hotel info
    SELECT @v_hotel_name = name, @v_price_per_night = price_per_night,
           @v_threshold = complimentary_threshold_hours
    FROM dbo.hotels WHERE hotel_id = @p_hotel_id;

    -- Check complimentary qualification (e.g. Layover >= 8 hours)
    IF @v_layover_hours >= @v_threshold
    BEGIN
        SET @v_is_complimentary = 1;
        SET @v_final_hotel_price = 0.00;
        SET @v_voucher = CONCAT('COMP-HTL-', CAST(ABS(CHECKSUM(NEWID())) % 9000 + 1000 AS VARCHAR(4)));
    END
    ELSE
    BEGIN
        SET @v_is_complimentary = 0;
        SET @v_final_hotel_price = @v_price_per_night;
        SET @v_voucher = CONCAT('PAID-HTL-', CAST(ABS(CHECKSUM(NEWID())) % 9000 + 1000 AS VARCHAR(4)));
    END

    -- Insert hotel booking
    INSERT INTO dbo.hotel_bookings (
        hotel_id, hotel_name, user_id, guest_email, voucher_code, reservation_id,
        pnr_code, passenger_name, room_type, check_in_date, check_out_date,
        is_complimentary, amount, booking_status
    )
    VALUES (
        @p_hotel_id, @v_hotel_name, @v_user_id, @v_guest_email, @v_voucher, @p_reservation_id,
        @v_pnr, @v_passenger_name, @p_room_type, @p_check_in, @p_check_out,
        @v_is_complimentary, @v_final_hotel_price, 'CONFIRMED'
    );

    -- Update reservation flag
    UPDATE dbo.reservations
    SET hotel_booked = 1,
        hotel_id = @p_hotel_id,
        hotel_name = @v_hotel_name,
        hotel_price = @v_final_hotel_price,
        hotel_voucher_code = @v_voucher
    WHERE reservation_id = @p_reservation_id;

    SELECT @v_voucher AS voucher_code, @v_is_complimentary AS is_complimentary, @v_final_hotel_price AS hotel_charge;
END;
GO

-- Member 6 Execution & Test:
-- EXEC dbo.sp_BookLayoverTransitHotel
--     @p_reservation_id = 2,
--     @p_hotel_id = 1,
--     @p_room_type = 'Deluxe Transit Suite',
--     @p_check_in = '2026-10-15',
--     @p_check_out = '2026-10-16';
-- GO


-- ============================================================================
-- ============================================================================
-- PART F: DATABASE TRIGGERS (15%) - ALL 6 GROUP MEMBERS
-- ============================================================================
-- ============================================================================

-- ----------------------------------------------------------------------------
-- MEMBER 1: SEARCH FLIGHT MODULE
-- Trigger: trg_ValidateFlightScheduleDates
-- Purpose: Ensures arrival time is strictly after departure time before schedule insertion/update
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.trg_ValidateFlightScheduleDates', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_ValidateFlightScheduleDates;
GO

CREATE TRIGGER dbo.trg_ValidateFlightScheduleDates
ON dbo.flights
FOR INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1 FROM inserted 
        WHERE arrival_time <= departure_time
    )
    BEGIN
        RAISERROR('Data Integrity Error: Flight Arrival Time must be after Departure Time.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;
GO

-- Member 1 Trigger Test (Demonstrating Validation Rollback):
-- INSERT INTO dbo.flights (flight_number, origin_code, destination_code, departure_time, arrival_time, base_price_economy, base_price_business, base_price_first)
-- VALUES ('SK-ERR01', 'CMB', 'DXB', '2026-11-01 10:00:00', '2026-11-01 08:00:00', 300, 600, 1000);
-- GO


-- ----------------------------------------------------------------------------
-- MEMBER 2: RESERVATIONS MODULE
-- Trigger: trg_AfterReservationInsert_UpdateSeats
-- Purpose: Automatically decrements available seats on the booked flight upon reservation creation
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.trg_AfterReservationInsert_UpdateSeats', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_AfterReservationInsert_UpdateSeats;
GO

CREATE TRIGGER dbo.trg_AfterReservationInsert_UpdateSeats
ON dbo.reservations
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE f
    SET f.available_seats = CASE 
        WHEN f.available_seats >= 1 THEN f.available_seats - 1 
        ELSE 0 
    END
    FROM dbo.flights f
    INNER JOIN inserted i ON f.flight_id = i.flight_id;
END;
GO

-- Member 2 Trigger Test:
-- SELECT flight_id, available_seats FROM dbo.flights WHERE flight_id = 1;
-- INSERT INTO dbo.reservations (pnr_code, user_id, flight_id, cabin_class, total_amount, booking_status)
-- VALUES ('TEST-PNR1', 1, 1, 'ECONOMY', 350.00, 'CONFIRMED');
-- SELECT flight_id, available_seats FROM dbo.flights WHERE flight_id = 1;
-- GO


-- ----------------------------------------------------------------------------
-- MEMBER 3: ONLINE PAYMENT MODULE
-- Trigger: trg_AfterPaymentSuccess_AwardLoyaltyPoints
-- Purpose: Automatically awards loyalty points (10% of transaction) to user upon successful payment
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.trg_AfterPaymentSuccess_AwardLoyaltyPoints', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_AfterPaymentSuccess_AwardLoyaltyPoints;
GO

CREATE TRIGGER dbo.trg_AfterPaymentSuccess_AwardLoyaltyPoints
ON dbo.payments
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE u
    SET u.loyalty_points = u.loyalty_points + CAST(ROUND(i.amount * 0.10, 0) AS INT)
    FROM dbo.users u
    INNER JOIN dbo.reservations r ON u.user_id = r.user_id
    INNER JOIN inserted i ON r.reservation_id = i.reservation_id
    WHERE i.payment_status = 'SUCCESS';
END;
GO

-- Member 3 Trigger Test:
-- SELECT user_id, first_name, loyalty_points FROM dbo.users WHERE user_id = 1;
-- INSERT INTO dbo.payments (reservation_id, transaction_reference, payment_method, amount, payment_status)
-- VALUES (1, 'TXN-PTS-DEMO', 'CREDIT_CARD', 500.00, 'SUCCESS');
-- SELECT user_id, first_name, loyalty_points FROM dbo.users WHERE user_id = 1;
-- GO


-- ----------------------------------------------------------------------------
-- MEMBER 4: CANCEL TICKET AND REFUND MODULE
-- Trigger: trg_AfterRefundApproved_RestoreSeats
-- Purpose: Automatically restores seat availability on the flight when a refund is approved
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.trg_AfterRefundApproved_RestoreSeats', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_AfterRefundApproved_RestoreSeats;
GO

CREATE TRIGGER dbo.trg_AfterRefundApproved_RestoreSeats
ON dbo.refund_requests
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(status)
    BEGIN
        UPDATE f
        SET f.available_seats = CASE 
            WHEN f.available_seats + 1 <= f.total_seats THEN f.available_seats + 1
            ELSE f.total_seats 
        END
        FROM dbo.flights f
        INNER JOIN dbo.reservations r ON f.flight_id = r.flight_id
        INNER JOIN inserted i ON r.reservation_id = i.reservation_id
        INNER JOIN deleted d ON i.refund_id = d.refund_id
        WHERE i.status = 'APPROVED' AND d.status <> 'APPROVED';
    END
END;
GO

-- Member 4 Trigger Test:
-- SELECT f.flight_id, f.available_seats FROM dbo.flights f WHERE f.flight_id = 1;
-- UPDATE dbo.refund_requests SET status = 'APPROVED' WHERE refund_id = 1;
-- SELECT f.flight_id, f.available_seats FROM dbo.flights f WHERE f.flight_id = 1;
-- GO


-- ----------------------------------------------------------------------------
-- MEMBER 5: MANAGE FLIGHT SCHEDULE MODULE
-- Trigger: trg_AfterFlightCancel_CancelReservations
-- Purpose: When a flight schedule is CANCELLED by admin, automatically cancels all its active reservations
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.trg_AfterFlightCancel_CancelReservations', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_AfterFlightCancel_CancelReservations;
GO

CREATE TRIGGER dbo.trg_AfterFlightCancel_CancelReservations
ON dbo.flights
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- If flight status is changed to CANCELLED, cancel all its active reservations
    IF UPDATE(status)
    BEGIN
        UPDATE r
        SET r.booking_status = 'CANCELLED'
        FROM dbo.reservations r
        INNER JOIN inserted i ON r.flight_id = i.flight_id
        INNER JOIN deleted d ON i.flight_id = d.flight_id
        WHERE i.status = 'CANCELLED' AND d.status <> 'CANCELLED';
    END
END;
GO

-- Member 5 Trigger Test:
-- 1. Check current reservations for Flight 1
-- SELECT reservation_id, pnr_code, flight_id, booking_status FROM dbo.reservations WHERE flight_id = 1;

-- 2. Admin cancels the flight schedule
-- UPDATE dbo.flights SET status = 'CANCELLED' WHERE flight_id = 1;

-- 3. Check reservations again (All bookings on Flight 1 are automatically changed to CANCELLED!)
-- SELECT reservation_id, pnr_code, flight_id, booking_status FROM dbo.reservations WHERE flight_id = 1;
-- GO


-- ----------------------------------------------------------------------------
-- MEMBER 6: BOOK LAYOVER HOTEL ACCOMMODATION MODULE
-- Trigger: trg_AfterHotelBooking_UpdateRoomInventory
-- Purpose: Decrements available room count in partner hotel when a transit booking is confirmed
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.trg_AfterHotelBooking_UpdateRoomInventory', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_AfterHotelBooking_UpdateRoomInventory;
GO

CREATE TRIGGER dbo.trg_AfterHotelBooking_UpdateRoomInventory
ON dbo.hotel_bookings
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE h
    SET h.available_rooms = CASE 
        WHEN h.available_rooms >= 1 THEN h.available_rooms - 1
        ELSE 0 
    END
    FROM dbo.hotels h
    INNER JOIN inserted i ON h.hotel_id = i.hotel_id
    WHERE i.booking_status = 'CONFIRMED';
END;
GO

-- Member 6 Trigger Test:
-- SELECT hotel_id, name, available_rooms FROM dbo.hotels WHERE hotel_id = 1;
-- INSERT INTO dbo.hotel_bookings (hotel_id, hotel_name, user_id, guest_email, voucher_code, reservation_id, room_type, amount, booking_status)
-- VALUES (1, 'Dubai International Airport Hotel', 1, 'guest@test.com', 'HTL-TEST01', 1, 'Deluxe Suite', 0.00, 'CONFIRMED');
-- SELECT hotel_id, name, available_rooms FROM dbo.hotels WHERE hotel_id = 1;
-- GO
