-- SkyLine Air - Web-Based Airline Ticket Reservation System
-- Database Schema Definition (SQL)
-- Module: SE2030 Software Engineering
-- Fully synchronized with H2 Console & JPA Domain Entities

-- 1. Users Table (30 attributes)
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    title VARCHAR(10) DEFAULT 'Mr',
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    dob VARCHAR(30),
    gender VARCHAR(20),
    nationality VARCHAR(50),
    country VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(50),
    postal_code VARCHAR(20),
    role VARCHAR(30) DEFAULT 'PASSENGER',
    passport_number VARCHAR(30),
    passport_expiry VARCHAR(30),
    passport_issuing_country VARCHAR(50),
    frequent_flyer_number VARCHAR(20) UNIQUE,
    loyalty_points INT DEFAULT 1200,
    loyalty_tier VARCHAR(30) DEFAULT 'Gold VIP',
    seat_preference VARCHAR(30) DEFAULT 'Window',
    meal_preference VARCHAR(50) DEFAULT 'Standard',
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(30),
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Saved Payment Cards Table (10 attributes)
CREATE TABLE IF NOT EXISTS user_cards (
    card_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    card_type VARCHAR(20) NOT NULL,
    card_holder VARCHAR(100) NOT NULL,
    card_number_masked VARCHAR(25),
    last4 VARCHAR(4) NOT NULL,
    expiry VARCHAR(10) NOT NULL,
    cvv VARCHAR(4),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Airports Table (4 attributes)
CREATE TABLE IF NOT EXISTS airports (
    airport_code VARCHAR(3) PRIMARY KEY,
    airport_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL
);

-- 4. Aircraft Fleet Table (7 attributes)
CREATE TABLE IF NOT EXISTS aircraft (
    aircraft_id INT PRIMARY KEY AUTO_INCREMENT,
    model VARCHAR(50) NOT NULL,
    tail_number VARCHAR(20) UNIQUE NOT NULL,
    economy_seats INT NOT NULL DEFAULT 150,
    business_seats INT NOT NULL DEFAULT 30,
    first_class_seats INT NOT NULL DEFAULT 12,
    status VARCHAR(30) DEFAULT 'ACTIVE'
);

-- 5. Flight Schedules Table (24 attributes)
CREATE TABLE IF NOT EXISTS flights (
    flight_id INT PRIMARY KEY AUTO_INCREMENT,
    flight_number VARCHAR(10) UNIQUE NOT NULL,
    origin_code VARCHAR(3) NOT NULL,
    destination_code VARCHAR(3) NOT NULL,
    origin_city VARCHAR(50),
    destination_city VARCHAR(50),
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    duration VARCHAR(20),
    stops INT DEFAULT 0,
    has_layover BOOLEAN DEFAULT FALSE,
    layover_airport VARCHAR(10),
    layover_city VARCHAR(50),
    layover_duration_hours DOUBLE DEFAULT 0.0,
    aircraft_id INT,
    aircraft_model VARCHAR(50),
    tail_number VARCHAR(20),
    base_price_economy DECIMAL(10, 2) NOT NULL,
    base_price_business DECIMAL(10, 2) NOT NULL,
    base_price_first DECIMAL(10, 2) NOT NULL,
    total_seats INT DEFAULT 60,
    available_seats INT DEFAULT 45,
    status VARCHAR(30) DEFAULT 'ON_TIME',
    image VARCHAR(255)
);

-- 6. Reservations & Bookings Table (22 attributes)
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id INT PRIMARY KEY AUTO_INCREMENT,
    pnr_code VARCHAR(10) UNIQUE NOT NULL,
    user_id INT,
    user_name VARCHAR(100),
    user_email VARCHAR(100),
    flight_id INT,
    flight_number VARCHAR(10),
    origin VARCHAR(50),
    destination VARCHAR(50),
    departure_time VARCHAR(50),
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cabin_class VARCHAR(30) DEFAULT 'ECONOMY',
    total_amount DECIMAL(10, 2) NOT NULL,
    booking_status VARCHAR(30) DEFAULT 'PENDING_PAYMENT',
    payment_status VARCHAR(30) DEFAULT 'PENDING',
    payment_method VARCHAR(30),
    transaction_ref VARCHAR(50),
    has_layover BOOLEAN DEFAULT FALSE,
    layover_city VARCHAR(50),
    layover_airport VARCHAR(10),
    layover_duration_hours DOUBLE DEFAULT 0.0,
    hotel_booked BOOLEAN DEFAULT FALSE,
    hotel_id INT,
    hotel_name VARCHAR(100),
    hotel_city VARCHAR(50),
    hotel_country VARCHAR(50),
    hotel_room_type VARCHAR(50),
    hotel_price DECIMAL(10, 2) DEFAULT 0.00,
    hotel_voucher_code VARCHAR(30)
);

-- 7. Passenger Details Table (12 attributes)
CREATE TABLE IF NOT EXISTS passengers (
    passenger_id INT PRIMARY KEY AUTO_INCREMENT,
    reservation_id INT,
    title VARCHAR(10),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    dob VARCHAR(30),
    passport_number VARCHAR(30),
    nationality VARCHAR(50),
    seat_number VARCHAR(10),
    cabin_class VARCHAR(30) DEFAULT 'ECONOMY',
    meal_preference VARCHAR(100) DEFAULT 'Standard Gourmet',
    extra_baggage_kg INT DEFAULT 0
);

-- 8. Payment Transactions Table (7 attributes)
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    reservation_id INT,
    transaction_reference VARCHAR(50) UNIQUE NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(30) DEFAULT 'SUCCESS',
    payment_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Ticket Cancellations & Refunds Table (14 attributes)
CREATE TABLE IF NOT EXISTS refund_requests (
    refund_id INT PRIMARY KEY AUTO_INCREMENT,
    refund_reference VARCHAR(20) UNIQUE NOT NULL,
    pnr VARCHAR(20),
    reservation_id INT,
    user_name VARCHAR(100),
    user_email VARCHAR(100),
    flight_number VARCHAR(20),
    original_fare DECIMAL(10, 2),
    cancellation_fee DECIMAL(10, 2),
    refund_amount DECIMAL(10, 2),
    reason TEXT,
    status VARCHAR(30) DEFAULT 'REQUESTED',
    requested_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME
);

-- 10. Hotel Partners Table (11 attributes)
CREATE TABLE IF NOT EXISTS hotels (
    hotel_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    country VARCHAR(50) DEFAULT 'UAE',
    airport_code VARCHAR(3) NOT NULL,
    star_rating INT DEFAULT 4,
    price_per_night DECIMAL(10, 2) NOT NULL,
    available_rooms INT NOT NULL,
    distance_km DOUBLE DEFAULT 1.0,
    complimentary_threshold_hours INT DEFAULT 8,
    shuttle_service BOOLEAN DEFAULT TRUE,
    image VARCHAR(255)
);

-- 11. Hotel Bookings Table (13 attributes)
CREATE TABLE IF NOT EXISTS hotel_bookings (
    hotel_booking_id INT PRIMARY KEY AUTO_INCREMENT,
    hotel_id INT,
    hotel_name VARCHAR(100),
    user_id INT,
    guest_email VARCHAR(120),
    voucher_code VARCHAR(30),
    reservation_id INT,
    pnr_code VARCHAR(20),
    passenger_name VARCHAR(100),
    room_type VARCHAR(30) DEFAULT 'Deluxe Transit Suite',
    check_in_date DATE,
    check_out_date DATE,
    is_complimentary BOOLEAN DEFAULT FALSE,
    amount DECIMAL(10, 2) NOT NULL,
    booking_status VARCHAR(30) DEFAULT 'CONFIRMED',
    created_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Flight Price Alerts & Saved Searches Table (12 attributes)
CREATE TABLE IF NOT EXISTS price_alerts (
    alert_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    user_email VARCHAR(100) NOT NULL,
    origin_code VARCHAR(3) NOT NULL,
    origin_city VARCHAR(50),
    destination_code VARCHAR(3) NOT NULL,
    destination_city VARCHAR(50),
    target_price DECIMAL(10, 2) NOT NULL,
    cabin_class VARCHAR(20) DEFAULT 'ECONOMY',
    frequency VARCHAR(20) DEFAULT 'INSTANT',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
