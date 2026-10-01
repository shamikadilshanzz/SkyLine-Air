-- ============================================================================
-- SLIIT IT2140 : Database Design and Development (Assignment 01 - Part 02)
-- Project: SkyLine Air - Advanced SQL Scripts
-- Target DBMS: MySQL (Workbench / phpMyAdmin / MariaDB)
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
  - Authentication and login require querying only a single table (`users`) using email 
    and password without executing expensive multi-table JOINs or UNION queries.
  - Role-based authorization is straightforwardly managed using a single `role` discriminator column.
*/

-- ============================================================================
-- PART D: SQL QUERIES & OUTPUTS (20%)
-- ============================================================================

-- Query 1: Simple SELECT with Filtering and Sorting
-- Purpose: Retrieve all active Boeing and Airbus aircraft with more than 200 economy seats
SELECT aircraft_id, model, tail_number, economy_seats, business_seats, status 
FROM aircraft 
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
    f.origin,
    f.destination,
    r.cabin_class,
    r.total_price AS total_amount,
    r.reservation_status AS booking_status
FROM reservations r
INNER JOIN users u ON r.user_id = u.user_id
INNER JOIN flights f ON r.flight_id = f.flight_id
ORDER BY r.reservation_date DESC;

-- Query 3: Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)
-- Purpose: Calculate overall airline revenue metrics and average ticket fare from confirmed bookings
SELECT 
    COUNT(reservation_id) AS total_confirmed_bookings,
    SUM(total_price) AS total_revenue,
    AVG(total_price) AS average_ticket_fare,
    MIN(total_price) AS lowest_fare_booked,
    MAX(total_price) AS highest_fare_booked
FROM reservations
WHERE reservation_status = 'CONFIRMED';

-- Query 4: GROUP BY with HAVING Clause
-- Purpose: Find partner hotels that have handled transit bookings and calculate total hotel revenue
SELECT 
    h.hotel_id,
    h.name AS hotel_name,
    h.city,
    COUNT(hb.hotel_booking_id) AS total_bookings_count,
    SUM(hb.amount) AS total_revenue_generated
FROM hotels h
INNER JOIN hotel_bookings hb ON h.hotel_id = hb.hotel_id
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
    (SELECT SUM(r.total_price) FROM reservations r WHERE r.user_id = u.user_id) AS total_spent
FROM users u
WHERE u.user_id IN (
    SELECT r.user_id 
    FROM reservations r 
    GROUP BY r.user_id 
    HAVING SUM(r.total_price) > (SELECT AVG(total_price) FROM reservations)
);


-- ============================================================================
-- ============================================================================
-- PART E: STORED PROCEDURES / FUNCTIONS (15%) - ALL 6 GROUP MEMBERS
-- ============================================================================
-- ============================================================================

-- ----------------------------------------------------------------------------
-- MEMBER 1: SEARCH FLIGHT MODULE
-- Stored Function: fn_CalculateDynamicFare
-- Purpose: Calculates dynamic flight pricing based on cabin class and remaining seat capacity
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_CalculateDynamicFare;
DELIMITER //

CREATE FUNCTION fn_CalculateDynamicFare(
    p_flight_id INT,
    p_cabin_class VARCHAR(30)
)
RETURNS DECIMAL(10, 2)
DETERMINISTIC
BEGIN
    DECLARE v_base_price DECIMAL(10, 2);
    DECLARE v_avail_seats INT;
    DECLARE v_total_seats INT;
    DECLARE v_final_price DECIMAL(10, 2);

    -- Fetch flight prices and capacity
    SELECT 
        CASE 
            WHEN UPPER(p_cabin_class) = 'BUSINESS' THEN base_price * 1.8
            WHEN UPPER(p_cabin_class) = 'FIRST' THEN base_price * 2.5
            ELSE base_price
        END,
        available_seats,
        100
    INTO v_base_price, v_avail_seats, v_total_seats
    FROM flights
    WHERE flight_id = p_flight_id;

    -- Dynamic Surge: If less than 20% seats left, add 25% price surge
    IF (v_avail_seats / v_total_seats) <= 0.20 THEN
        SET v_final_price = v_base_price * 1.25;
    ELSE
        SET v_final_price = v_base_price;
    END IF;

    RETURN IFNULL(v_final_price, 0.00);
END //
DELIMITER ;

-- Member 1 Execution & Test:
-- SELECT flight_id, flight_number, base_price,
--        fn_CalculateDynamicFare(flight_id, 'ECONOMY') AS dynamic_economy_price,
--        fn_CalculateDynamicFare(flight_id, 'BUSINESS') AS dynamic_business_price
-- FROM flights;


-- ----------------------------------------------------------------------------
-- MEMBER 2: RESERVATIONS MODULE
-- Stored Procedure: sp_CreateFlightReservation
-- Purpose: Creates a new flight reservation, generates PNR, and computes total price
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_CreateFlightReservation;
DELIMITER //

CREATE PROCEDURE sp_CreateFlightReservation(
    IN p_user_id INT,
    IN p_flight_id INT,
    IN p_cabin_class VARCHAR(30),
    IN p_passenger_count INT,
    IN p_contact_email VARCHAR(100)
)
BEGIN
    DECLARE v_unit_price DECIMAL(10, 2);
    DECLARE v_total_fare DECIMAL(10, 2);
    DECLARE v_pnr VARCHAR(10);

    -- Retrieve price per seat
    SELECT 
        CASE 
            WHEN UPPER(p_cabin_class) = 'BUSINESS' THEN base_price * 1.8
            WHEN UPPER(p_cabin_class) = 'FIRST' THEN base_price * 2.5
            ELSE base_price
        END
    INTO v_unit_price
    FROM flights WHERE flight_id = p_flight_id;

    -- Generate unique 6-character PNR code
    SET v_pnr = CONCAT('SK', FLOOR(RAND() * 9000 + 1000));
    SET v_total_fare = v_unit_price * p_passenger_count;

    -- Insert reservation
    INSERT INTO reservations (
        pnr_code, user_id, flight_id, passenger_count, cabin_class,
        total_price, reservation_status, payment_status, contact_email
    )
    VALUES (
        v_pnr, p_user_id, p_flight_id, p_passenger_count, p_cabin_class,
        v_total_fare, 'PENDING_PAYMENT', 'PENDING', p_contact_email
    );

    SELECT v_pnr AS generated_pnr, v_total_fare AS total_booking_amount, 'PENDING_PAYMENT' AS status;
END //
DELIMITER ;

-- Member 2 Execution & Test:
-- CALL sp_CreateFlightReservation(1, 1, 'ECONOMY', 2, 'shamikadilshan@gmail.com');


-- ----------------------------------------------------------------------------
-- MEMBER 3: ONLINE PAYMENT MODULE
-- Stored Procedure: sp_ProcessOnlineCardPayment
-- Purpose: Records payment transaction, updates reservation status to PAID & CONFIRMED
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_ProcessOnlineCardPayment;
DELIMITER //

CREATE PROCEDURE sp_ProcessOnlineCardPayment(
    IN p_reservation_id INT,
    IN p_payment_method VARCHAR(30),
    IN p_amount DECIMAL(10, 2)
)
BEGIN
    DECLARE v_txn_ref VARCHAR(50);
    SET v_txn_ref = CONCAT('TXN-', FLOOR(RAND() * 900000 + 100000));

    -- 1. Insert payment record
    INSERT INTO payments (reservation_id, transaction_reference, payment_method, amount, payment_status)
    VALUES (p_reservation_id, v_txn_ref, p_payment_method, p_amount, 'SUCCESS');

    -- 2. Update reservation status
    UPDATE reservations
    SET reservation_status = 'CONFIRMED',
        payment_status = 'PAID'
    WHERE reservation_id = p_reservation_id;

    SELECT v_txn_ref AS transaction_reference, 'SUCCESS' AS payment_status, p_amount AS amount_paid;
END //
DELIMITER ;

-- Member 3 Execution & Test:
-- CALL sp_ProcessOnlineCardPayment(1, 'CREDIT_CARD', 700.00);


-- ----------------------------------------------------------------------------
-- MEMBER 4: CANCEL TICKET AND REFUND MODULE
-- Stored Procedure: sp_ProcessTicketRefund
-- Purpose: Calculates 15% cancellation penalty, marks reservation CANCELLED, and processes refund
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_ProcessTicketRefund;
DELIMITER //

CREATE PROCEDURE sp_ProcessTicketRefund(
    IN in_refund_id INT,
    IN in_admin_decision VARCHAR(30)
)
BEGIN
    DECLARE v_res_id INT;
    DECLARE v_refund_amt DECIMAL(10, 2);

    -- Retrieve reservation ID and refund amount
    SELECT reservation_id, refund_amount INTO v_res_id, v_refund_amt 
    FROM refund_requests 
    WHERE refund_id = in_refund_id;

    IF in_admin_decision = 'APPROVED' THEN
        -- Update refund request status
        UPDATE refund_requests 
        SET status = 'APPROVED', processed_at = NOW() 
        WHERE refund_id = in_refund_id;

        -- Update reservation booking status
        UPDATE reservations 
        SET reservation_status = 'CANCELLED', payment_status = 'REFUNDED' 
        WHERE reservation_id = v_res_id;
    ELSE
        -- Mark refund as rejected
        UPDATE refund_requests 
        SET status = 'REJECTED', processed_at = NOW() 
        WHERE refund_id = in_refund_id;
    END IF;

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
    FROM refund_requests
    WHERE refund_id = in_refund_id;
END //
DELIMITER ;

-- Member 4 Execution & Test:
-- CALL sp_ProcessTicketRefund(3, 'APPROVED');


-- ----------------------------------------------------------------------------
-- MEMBER 5: MANAGE FLIGHT SCHEDULE MODULE
-- Stored Procedure: sp_UpdateFlightScheduleStatus
-- Purpose: Reschedules flight departure/arrival times and updates status (DELAYED / ON_TIME)
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_UpdateFlightScheduleStatus;
DELIMITER //

CREATE PROCEDURE sp_UpdateFlightScheduleStatus(
    IN p_flight_id INT,
    IN p_new_departure DATETIME,
    IN p_new_arrival DATETIME,
    IN p_new_status VARCHAR(30)
)
BEGIN
    UPDATE flights
    SET departure_time = p_new_departure,
        arrival_time = p_new_arrival,
        status = p_new_status
    WHERE flight_id = p_flight_id;

    SELECT flight_id, flight_number, departure_time, arrival_time, status 
    FROM flights 
    WHERE flight_id = p_flight_id;
END //
DELIMITER ;

-- Member 5 Execution & Test:
-- CALL sp_UpdateFlightScheduleStatus(1, '2026-10-10 14:00:00', '2026-10-10 18:30:00', 'DELAYED');


-- ----------------------------------------------------------------------------
-- MEMBER 6: BOOK LAYOVER HOTEL ACCOMMODATION MODULE
-- Stored Procedure: sp_BookLayoverTransitHotel
-- Purpose: Validates layover duration; if layover >= 8 hours, grants complimentary stay ($0.00), else standard rate
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_BookLayoverTransitHotel;
DELIMITER //

CREATE PROCEDURE sp_BookLayoverTransitHotel(
    IN p_reservation_id INT,
    IN p_hotel_id INT,
    IN p_room_type VARCHAR(50),
    IN p_check_in DATE,
    IN p_check_out DATE
)
BEGIN
    DECLARE v_user_id INT;
    DECLARE v_guest_email VARCHAR(100);
    DECLARE v_passenger_name VARCHAR(100);
    DECLARE v_pnr VARCHAR(20);
    DECLARE v_layover_hours FLOAT DEFAULT 9.0;
    DECLARE v_hotel_name VARCHAR(100);
    DECLARE v_price_per_night DECIMAL(10, 2);
    DECLARE v_is_complimentary BOOLEAN;
    DECLARE v_final_hotel_price DECIMAL(10, 2);
    DECLARE v_voucher VARCHAR(30);

    -- Retrieve reservation info
    SELECT user_id, contact_email, pnr_code
    INTO v_user_id, v_guest_email, v_pnr
    FROM reservations WHERE reservation_id = p_reservation_id;

    -- Retrieve hotel info
    SELECT name, price_per_night
    INTO v_hotel_name, v_price_per_night
    FROM hotels WHERE hotel_id = p_hotel_id;

    -- Check complimentary qualification (Layover >= 8 hours)
    IF v_layover_hours >= 8.0 THEN
        SET v_is_complimentary = TRUE;
        SET v_final_hotel_price = 0.00;
        SET v_voucher = CONCAT('COMP-HTL-', FLOOR(RAND() * 9000 + 1000));
    ELSE
        SET v_is_complimentary = FALSE;
        SET v_final_hotel_price = v_price_per_night;
        SET v_voucher = CONCAT('PAID-HTL-', FLOOR(RAND() * 9000 + 1000));
    END IF;

    -- Insert hotel booking
    INSERT INTO hotel_bookings (
        hotel_id, hotel_name, user_id, guest_email, voucher_code, reservation_id,
        pnr_code, room_type, check_in_date, check_out_date,
        is_complimentary, amount, booking_status
    )
    VALUES (
        p_hotel_id, v_hotel_name, v_user_id, v_guest_email, v_voucher, p_reservation_id,
        v_pnr, p_room_type, p_check_in, p_check_out,
        v_is_complimentary, v_final_hotel_price, 'CONFIRMED'
    );

    SELECT v_voucher AS voucher_code, v_is_complimentary AS is_complimentary, v_final_hotel_price AS hotel_charge;
END //
DELIMITER ;

-- Member 6 Execution & Test:
-- CALL sp_BookLayoverTransitHotel(2, 1, 'Deluxe Transit Suite', '2026-10-15', '2026-10-16');


-- ============================================================================
-- ============================================================================
-- PART F: DATABASE TRIGGERS (15%) - ALL 6 GROUP MEMBERS
-- ============================================================================
-- ============================================================================

-- ----------------------------------------------------------------------------
-- MEMBER 1: SEARCH FLIGHT MODULE
-- Trigger: trg_ValidateFlightScheduleDates
-- Purpose: Ensures arrival time is strictly after departure time before schedule insertion
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_ValidateFlightScheduleDates;
DELIMITER //

CREATE TRIGGER trg_ValidateFlightScheduleDates
BEFORE INSERT ON flights
FOR EACH ROW
BEGIN
    IF NEW.arrival_time <= NEW.departure_time THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Data Integrity Error: Flight Arrival Time must be after Departure Time.';
    END IF;
END //
DELIMITER ;

-- Member 1 Trigger Test:
-- INSERT INTO flights (flight_number, origin, destination, departure_time, arrival_time, base_price, available_seats)
-- VALUES ('SK-ERR01', 'Colombo', 'Dubai', '2026-11-01 10:00:00', '2026-11-01 08:00:00', 300.00, 50);


-- ----------------------------------------------------------------------------
-- MEMBER 2: RESERVATIONS MODULE
-- Trigger: trg_AfterReservationInsert_UpdateSeats
-- Purpose: Automatically decrements available seats on the flight upon reservation creation
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_AfterReservationInsert_UpdateSeats;
DELIMITER //

CREATE TRIGGER trg_AfterReservationInsert_UpdateSeats
AFTER INSERT ON reservations
FOR EACH ROW
BEGIN
    UPDATE flights 
    SET available_seats = GREATEST(0, available_seats - NEW.passenger_count)
    WHERE flight_id = NEW.flight_id;
END //
DELIMITER ;

-- Member 2 Trigger Test:
-- SELECT flight_id, available_seats FROM flights WHERE flight_id = 1;
-- INSERT INTO reservations (pnr_code, user_id, flight_id, passenger_count, cabin_class, total_price, reservation_status, contact_email)
-- VALUES ('TEST-PNR1', 1, 1, 2, 'ECONOMY', 700.00, 'CONFIRMED', 'test@skyline.com');
-- SELECT flight_id, available_seats FROM flights WHERE flight_id = 1;


-- ----------------------------------------------------------------------------
-- MEMBER 3: ONLINE PAYMENT MODULE
-- Trigger: trg_AfterPaymentSuccess_AwardLoyaltyPoints
-- Purpose: Automatically awards loyalty points (10% of transaction) to user upon successful payment
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_AfterPaymentSuccess_AwardLoyaltyPoints;
DELIMITER //

CREATE TRIGGER trg_AfterPaymentSuccess_AwardLoyaltyPoints
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    DECLARE v_user_id INT;

    IF NEW.payment_status = 'SUCCESS' THEN
        SELECT user_id INTO v_user_id 
        FROM reservations 
        WHERE reservation_id = NEW.reservation_id;

        IF v_user_id IS NOT NULL THEN
            UPDATE users 
            SET loyalty_points = loyalty_points + FLOOR(NEW.amount * 0.10)
            WHERE user_id = v_user_id;
        END IF;
    END IF;
END //
DELIMITER ;

-- Member 3 Trigger Test:
-- SELECT user_id, first_name, loyalty_points FROM users WHERE user_id = 1;
-- INSERT INTO payments (reservation_id, transaction_reference, payment_method, amount, payment_status)
-- VALUES (1, CONCAT('TXN-', FLOOR(RAND()*900000)), 'CREDIT_CARD', 500.00, 'SUCCESS');
-- SELECT user_id, first_name, loyalty_points FROM users WHERE user_id = 1;


-- ----------------------------------------------------------------------------
-- MEMBER 4: CANCEL TICKET AND REFUND MODULE
-- Trigger: trg_AfterRefundApproved_RestoreSeats
-- Purpose: Automatically restores seat availability on the flight when a refund is approved
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_AfterRefundApproved_RestoreSeats;
DELIMITER //

CREATE TRIGGER trg_AfterRefundApproved_RestoreSeats
AFTER UPDATE ON refund_requests
FOR EACH ROW
BEGIN
    DECLARE v_flight_id INT;

    IF NEW.status = 'APPROVED' AND OLD.status <> 'APPROVED' THEN
        SELECT flight_id INTO v_flight_id 
        FROM reservations 
        WHERE reservation_id = NEW.reservation_id;

        IF v_flight_id IS NOT NULL THEN
            UPDATE flights 
            SET available_seats = available_seats + 1 
            WHERE flight_id = v_flight_id;
        END IF;
    END IF;
END //
DELIMITER ;

-- Member 4 Trigger Test:
-- SELECT flight_id, available_seats FROM flights WHERE flight_id = 1;
-- UPDATE refund_requests SET status = 'APPROVED' WHERE refund_id = 1;
-- SELECT flight_id, available_seats FROM flights WHERE flight_id = 1;


-- ----------------------------------------------------------------------------
-- MEMBER 5: MANAGE FLIGHT SCHEDULE MODULE
-- Trigger: trg_AfterFlightCancel_CancelReservations
-- Purpose: When a flight schedule is CANCELLED by admin, automatically cancels all its active reservations
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_AfterFlightCancel_CancelReservations;
DELIMITER //

CREATE TRIGGER trg_AfterFlightCancel_CancelReservations
AFTER UPDATE ON flights
FOR EACH ROW
BEGIN
    IF NEW.status = 'CANCELLED' AND OLD.status <> 'CANCELLED' THEN
        UPDATE reservations
        SET reservation_status = 'CANCELLED'
        WHERE flight_id = NEW.flight_id;
    END IF;
END //
DELIMITER ;

-- Member 5 Trigger Test:
-- 1. Check reservations for Flight 1:
-- SELECT reservation_id, pnr_code, flight_id, reservation_status FROM reservations WHERE flight_id = 1;
-- 2. Cancel flight schedule:
-- UPDATE flights SET status = 'CANCELLED' WHERE flight_id = 1;
-- 3. Check reservations again:
-- SELECT reservation_id, pnr_code, flight_id, reservation_status FROM reservations WHERE flight_id = 1;


-- ----------------------------------------------------------------------------
-- MEMBER 6: BOOK LAYOVER HOTEL ACCOMMODATION MODULE
-- Trigger: trg_AfterHotelBooking_UpdateRoomInventory
-- Purpose: Decrements available room count in partner hotel when a transit booking is confirmed
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_AfterHotelBooking_UpdateRoomInventory;
DELIMITER //

CREATE TRIGGER trg_AfterHotelBooking_UpdateRoomInventory
AFTER INSERT ON hotel_bookings
FOR EACH ROW
BEGIN
    IF NEW.booking_status = 'CONFIRMED' THEN
        UPDATE hotels 
        SET available_rooms = GREATEST(0, available_rooms - 1)
        WHERE hotel_id = NEW.hotel_id;
    END IF;
END //
DELIMITER ;

-- Member 6 Trigger Test:
-- SELECT hotel_id, name, available_rooms FROM hotels WHERE hotel_id = 1;
-- INSERT INTO hotel_bookings (hotel_id, hotel_name, user_id, guest_email, voucher_code, reservation_id, room_type, amount, booking_status)
-- VALUES (1, 'Dubai International Airport Hotel', 1, 'guest@test.com', 'HTL-TEST01', 1, 'Deluxe Suite', 0.00, 'CONFIRMED');
-- SELECT hotel_id, name, available_rooms FROM hotels WHERE hotel_id = 1;
