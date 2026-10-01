-- ============================================================================
-- SLIIT IT2140: Database Design and Development (Assignment 01 - Part 02)
-- Project: SkyLine Air - Airline Ticket Reservation System
-- Target DBMS: Microsoft SQL Server (SSMS / T-SQL Dialect)
-- ============================================================================

-- Create and Use Database (Optional - uncomment if creating a new database)
-- CREATE DATABASE SkyLineAirDB;
-- GO
-- USE SkyLineAirDB;
-- GO

-- ----------------------------------------------------------------------------
-- Drop Child and Parent Tables in Reverse Dependency Order
-- ----------------------------------------------------------------------------
IF OBJECT_ID('dbo.price_alerts', 'U') IS NOT NULL DROP TABLE dbo.price_alerts;
IF OBJECT_ID('dbo.hotel_bookings', 'U') IS NOT NULL DROP TABLE dbo.hotel_bookings;
IF OBJECT_ID('dbo.refund_requests', 'U') IS NOT NULL DROP TABLE dbo.refund_requests;
IF OBJECT_ID('dbo.payments', 'U') IS NOT NULL DROP TABLE dbo.payments;
IF OBJECT_ID('dbo.passengers', 'U') IS NOT NULL DROP TABLE dbo.passengers;
IF OBJECT_ID('dbo.reservations', 'U') IS NOT NULL DROP TABLE dbo.reservations;
IF OBJECT_ID('dbo.hotels', 'U') IS NOT NULL DROP TABLE dbo.hotels;
IF OBJECT_ID('dbo.flights', 'U') IS NOT NULL DROP TABLE dbo.flights;
IF OBJECT_ID('dbo.user_cards', 'U') IS NOT NULL DROP TABLE dbo.user_cards;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;
IF OBJECT_ID('dbo.aircraft', 'U') IS NOT NULL DROP TABLE dbo.aircraft;
IF OBJECT_ID('dbo.airports', 'U') IS NOT NULL DROP TABLE dbo.airports;
GO

-- ============================================================================
-- 1. Airports Table (Master Lookup - 4 attributes)
-- ============================================================================
CREATE TABLE dbo.airports (
    airport_code VARCHAR(3) NOT NULL,
    airport_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    CONSTRAINT pk_airports PRIMARY KEY (airport_code)
);
GO

-- ============================================================================
-- 2. Aircraft Fleet Table (Master Fleet - 7 attributes)
-- ============================================================================
CREATE TABLE dbo.aircraft (
    aircraft_id INT IDENTITY(1,1) NOT NULL,
    model VARCHAR(50) NOT NULL,
    tail_number VARCHAR(20) NOT NULL,
    economy_seats INT NOT NULL DEFAULT 150,
    business_seats INT NOT NULL DEFAULT 30,
    first_class_seats INT NOT NULL DEFAULT 12,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT pk_aircraft PRIMARY KEY (aircraft_id),
    CONSTRAINT uq_aircraft_tail_number UNIQUE (tail_number)
);
GO

-- ============================================================================
-- 3. Users Table (Superclass & Subtypes via Single-Table Strategy - 29 attributes)
-- ISA Hierarchy Subtypes: Passenger, Ticketing Officer, Airline Admin, Hotel Manager
-- ============================================================================
CREATE TABLE dbo.users (
    user_id INT IDENTITY(1,1) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NULL,
    title VARCHAR(10) NULL DEFAULT 'Mr',
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    dob VARCHAR(30) NULL,
    gender VARCHAR(20) NULL,
    nationality VARCHAR(50) NULL,
    country VARCHAR(50) NULL,
    address VARCHAR(255) NULL,
    city VARCHAR(50) NULL,
    postal_code VARCHAR(20) NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'PASSENGER', -- Discriminator column
    passport_number VARCHAR(30) NULL,
    passport_expiry VARCHAR(30) NULL,
    passport_issuing_country VARCHAR(50) NULL,
    frequent_flyer_number VARCHAR(20) NULL,
    loyalty_points INT NOT NULL DEFAULT 1200,
    loyalty_tier VARCHAR(30) NOT NULL DEFAULT 'Gold VIP',
    seat_preference VARCHAR(30) NULL DEFAULT 'Window',
    meal_preference VARCHAR(50) NULL DEFAULT 'Standard',
    emergency_contact_name VARCHAR(100) NULL,
    emergency_contact_phone VARCHAR(30) NULL,
    emergency_contact_relationship VARCHAR(50) NULL,
    emergency_contact_email VARCHAR(100) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_users PRIMARY KEY (user_id),
    CONSTRAINT uq_users_email UNIQUE (email)
);
GO

-- Filtered Unique Index in SQL Server (Allows multiple NULLs while enforcing uniqueness on non-NULL values)
CREATE UNIQUE NONCLUSTERED INDEX uq_users_ffn 
ON dbo.users (frequent_flyer_number) 
WHERE frequent_flyer_number IS NOT NULL;
GO

-- ============================================================================
-- 4. Saved Payment Cards Table (10 attributes)
-- ============================================================================
CREATE TABLE dbo.user_cards (
    card_id INT IDENTITY(1,1) NOT NULL,
    user_id INT NOT NULL,
    card_type VARCHAR(20) NOT NULL,
    card_holder VARCHAR(100) NOT NULL,
    card_number_masked VARCHAR(25) NULL,
    last4 VARCHAR(4) NOT NULL,
    expiry VARCHAR(10) NOT NULL,
    cvv VARCHAR(4) NULL,
    is_default BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_user_cards PRIMARY KEY (card_id),
    CONSTRAINT fk_user_cards_user FOREIGN KEY (user_id) 
        REFERENCES dbo.users(user_id) ON DELETE CASCADE
);
GO

-- ============================================================================
-- 5. Flight Schedules Table (24 attributes)
-- ============================================================================
CREATE TABLE dbo.flights (
    flight_id INT IDENTITY(1,1) NOT NULL,
    flight_number VARCHAR(10) NOT NULL,
    origin_code VARCHAR(3) NOT NULL,
    destination_code VARCHAR(3) NOT NULL,
    origin_city VARCHAR(50) NULL,
    destination_city VARCHAR(50) NULL,
    departure_time DATETIME2 NOT NULL,
    arrival_time DATETIME2 NOT NULL,
    duration VARCHAR(20) NULL,
    stops INT NOT NULL DEFAULT 0,
    has_layover BIT NOT NULL DEFAULT 0,
    layover_airport VARCHAR(10) NULL,
    layover_city VARCHAR(50) NULL,
    layover_duration_hours FLOAT NOT NULL DEFAULT 0.0,
    aircraft_id INT NULL,
    aircraft_model VARCHAR(50) NULL,
    tail_number VARCHAR(20) NULL,
    base_price_economy DECIMAL(10, 2) NOT NULL,
    base_price_business DECIMAL(10, 2) NOT NULL,
    base_price_first DECIMAL(10, 2) NOT NULL,
    total_seats INT NOT NULL DEFAULT 60,
    available_seats INT NOT NULL DEFAULT 45,
    status VARCHAR(30) NOT NULL DEFAULT 'ON_TIME',
    image VARCHAR(255) NULL,
    CONSTRAINT pk_flights PRIMARY KEY (flight_id),
    CONSTRAINT uq_flights_flight_number UNIQUE (flight_number),
    CONSTRAINT fk_flights_origin FOREIGN KEY (origin_code) 
        REFERENCES dbo.airports(airport_code),
    CONSTRAINT fk_flights_destination FOREIGN KEY (destination_code) 
        REFERENCES dbo.airports(airport_code),
    CONSTRAINT fk_flights_aircraft FOREIGN KEY (aircraft_id) 
        REFERENCES dbo.aircraft(aircraft_id) ON DELETE SET NULL
);
GO

-- ============================================================================
-- 6. Hotel Partners Table (12 attributes)
-- ============================================================================
CREATE TABLE dbo.hotels (
    hotel_id INT IDENTITY(1,1) NOT NULL,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'UAE',
    airport_code VARCHAR(3) NOT NULL,
    star_rating INT NOT NULL DEFAULT 4,
    price_per_night DECIMAL(10, 2) NOT NULL,
    available_rooms INT NOT NULL,
    distance_km FLOAT NOT NULL DEFAULT 1.0,
    complimentary_threshold_hours INT NOT NULL DEFAULT 8,
    shuttle_service BIT NOT NULL DEFAULT 1,
    image VARCHAR(255) NULL,
    amenities VARCHAR(MAX) NULL,
    CONSTRAINT pk_hotels PRIMARY KEY (hotel_id),
    CONSTRAINT uq_hotels_name UNIQUE (name),
    CONSTRAINT fk_hotels_airport FOREIGN KEY (airport_code) 
        REFERENCES dbo.airports(airport_code)
);
GO

-- ============================================================================
-- 7. Reservations & Bookings Table (29 attributes)
-- ============================================================================
CREATE TABLE dbo.reservations (
    reservation_id INT IDENTITY(1,1) NOT NULL,
    pnr_code VARCHAR(10) NOT NULL,
    user_id INT NULL,
    user_name VARCHAR(100) NULL,
    user_email VARCHAR(100) NULL,
    flight_id INT NULL,
    flight_number VARCHAR(10) NULL,
    origin VARCHAR(50) NULL,
    destination VARCHAR(50) NULL,
    departure_time VARCHAR(50) NULL,
    booking_date DATETIME2 NOT NULL DEFAULT GETDATE(),
    cabin_class VARCHAR(30) NOT NULL DEFAULT 'ECONOMY',
    total_amount DECIMAL(10, 2) NOT NULL,
    booking_status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(30) NULL,
    transaction_ref VARCHAR(50) NULL,
    has_layover BIT NOT NULL DEFAULT 0,
    layover_city VARCHAR(50) NULL,
    layover_airport VARCHAR(10) NULL,
    layover_duration_hours FLOAT NOT NULL DEFAULT 0.0,
    hotel_booked BIT NOT NULL DEFAULT 0,
    hotel_id INT NULL,
    hotel_name VARCHAR(100) NULL,
    hotel_city VARCHAR(50) NULL,
    hotel_country VARCHAR(50) NULL,
    hotel_room_type VARCHAR(50) NULL,
    hotel_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    hotel_voucher_code VARCHAR(30) NULL,
    CONSTRAINT pk_reservations PRIMARY KEY (reservation_id),
    CONSTRAINT uq_reservations_pnr UNIQUE (pnr_code),
    CONSTRAINT fk_reservations_user FOREIGN KEY (user_id) 
        REFERENCES dbo.users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_reservations_flight FOREIGN KEY (flight_id) 
        REFERENCES dbo.flights(flight_id) ON DELETE SET NULL,
    CONSTRAINT fk_reservations_hotel FOREIGN KEY (hotel_id) 
        REFERENCES dbo.hotels(hotel_id) ON DELETE SET NULL
);
GO

-- ============================================================================
-- 8. Passenger Details Table (Weak Entity - 12 attributes)
-- Identifying Relationship: reservations -> passengers
-- Partial Key: passenger_id
-- Composite Primary Key: (reservation_id, passenger_id)
-- ============================================================================
CREATE TABLE dbo.passengers (
    reservation_id INT NOT NULL,
    passenger_id INT NOT NULL,
    title VARCHAR(10) NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    dob VARCHAR(30) NULL,
    passport_number VARCHAR(30) NULL,
    nationality VARCHAR(50) NULL,
    seat_number VARCHAR(10) NULL,
    cabin_class VARCHAR(30) NOT NULL DEFAULT 'ECONOMY',
    meal_preference VARCHAR(100) NULL DEFAULT 'Standard Gourmet',
    extra_baggage_kg INT NOT NULL DEFAULT 0,
    CONSTRAINT pk_passengers PRIMARY KEY (reservation_id, passenger_id),
    CONSTRAINT fk_passengers_reservation FOREIGN KEY (reservation_id) 
        REFERENCES dbo.reservations(reservation_id) ON DELETE CASCADE
);
GO

-- ============================================================================
-- 9. Payment Transactions Table (7 attributes)
-- ============================================================================
CREATE TABLE dbo.payments (
    payment_id INT IDENTITY(1,1) NOT NULL,
    reservation_id INT NOT NULL,
    transaction_reference VARCHAR(50) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
    payment_timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_payments PRIMARY KEY (payment_id),
    CONSTRAINT uq_payments_txn UNIQUE (transaction_reference),
    CONSTRAINT fk_payments_reservation FOREIGN KEY (reservation_id) 
        REFERENCES dbo.reservations(reservation_id) ON DELETE CASCADE
);
GO

-- ============================================================================
-- 10. Ticket Cancellations & Refunds Table (14 attributes)
-- ============================================================================
CREATE TABLE dbo.refund_requests (
    refund_id INT IDENTITY(1,1) NOT NULL,
    refund_reference VARCHAR(20) NOT NULL,
    pnr VARCHAR(20) NULL,
    reservation_id INT NULL,
    user_name VARCHAR(100) NULL,
    user_email VARCHAR(100) NULL,
    flight_number VARCHAR(20) NULL,
    original_fare DECIMAL(10, 2) NULL,
    cancellation_fee DECIMAL(10, 2) NULL,
    refund_amount DECIMAL(10, 2) NULL,
    reason VARCHAR(MAX) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',
    requested_date DATETIME2 NOT NULL DEFAULT GETDATE(),
    processed_at DATETIME2 NULL,
    CONSTRAINT pk_refund_requests PRIMARY KEY (refund_id),
    CONSTRAINT uq_refund_ref UNIQUE (refund_reference),
    CONSTRAINT fk_refunds_reservation FOREIGN KEY (reservation_id) 
        REFERENCES dbo.reservations(reservation_id) ON DELETE SET NULL
);
GO

-- ============================================================================
-- 11. Hotel Bookings Table (16 attributes)
-- ============================================================================
CREATE TABLE dbo.hotel_bookings (
    hotel_booking_id INT IDENTITY(1,1) NOT NULL,
    hotel_id INT NULL,
    hotel_name VARCHAR(100) NULL,
    user_id INT NULL,
    guest_email VARCHAR(120) NULL,
    voucher_code VARCHAR(30) NULL,
    reservation_id INT NULL,
    pnr_code VARCHAR(20) NULL,
    passenger_name VARCHAR(100) NULL,
    room_type VARCHAR(30) NOT NULL DEFAULT 'Deluxe Transit Suite',
    check_in_date DATE NULL,
    check_out_date DATE NULL,
    is_complimentary BIT NOT NULL DEFAULT 0,
    amount DECIMAL(10, 2) NOT NULL,
    booking_status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    created_timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_hotel_bookings PRIMARY KEY (hotel_booking_id),
    CONSTRAINT fk_hotel_bookings_hotel FOREIGN KEY (hotel_id) 
        REFERENCES dbo.hotels(hotel_id) ON DELETE SET NULL,
    CONSTRAINT fk_hotel_bookings_user FOREIGN KEY (user_id) 
        REFERENCES dbo.users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_hotel_bookings_reservation FOREIGN KEY (reservation_id) 
        REFERENCES dbo.reservations(reservation_id) ON DELETE SET NULL
);
GO

-- ============================================================================
-- 12. Flight Price Alerts & Saved Searches Table (12 attributes)
-- ============================================================================
CREATE TABLE dbo.price_alerts (
    alert_id INT IDENTITY(1,1) NOT NULL,
    user_id INT NOT NULL,
    user_email VARCHAR(100) NOT NULL,
    origin_code VARCHAR(3) NOT NULL,
    origin_city VARCHAR(50) NULL,
    destination_code VARCHAR(3) NOT NULL,
    destination_city VARCHAR(50) NULL,
    target_price DECIMAL(10, 2) NOT NULL,
    cabin_class VARCHAR(20) NOT NULL DEFAULT 'ECONOMY',
    frequency VARCHAR(20) NOT NULL DEFAULT 'INSTANT',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_price_alerts PRIMARY KEY (alert_id),
    CONSTRAINT fk_alerts_user FOREIGN KEY (user_id) 
        REFERENCES dbo.users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_alerts_origin FOREIGN KEY (origin_code) 
        REFERENCES dbo.airports(airport_code),
    CONSTRAINT fk_alerts_destination FOREIGN KEY (destination_code) 
        REFERENCES dbo.airports(airport_code)
);
GO
