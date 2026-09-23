-- SkyLine Air - Sample Data Population Script
-- Module: SE2030 Software Engineering
-- Fully synchronized with H2 Console & JPA Domain Entities

-- 1. Airports (4 attributes)
INSERT IGNORE INTO airports (airport_code, airport_name, city, country) VALUES
('CMB', 'Bandaranaike International Airport', 'Colombo', 'Sri Lanka'),
('SIN', 'Singapore Changi Airport', 'Singapore', 'Singapore'),
('DXB', 'Dubai International Airport', 'Dubai', 'UAE'),
('LHR', 'London Heathrow Airport', 'London', 'United Kingdom'),
('JFK', 'John F. Kennedy International Airport', 'New York', 'USA'),
('HND', 'Tokyo Haneda Airport', 'Tokyo', 'Japan'),
('SYD', 'Sydney Kingsford Smith Airport', 'Sydney', 'Australia');

-- 2. Aircraft Fleet (7 attributes)
INSERT IGNORE INTO aircraft (aircraft_id, model, tail_number, economy_seats, business_seats, first_class_seats, status) VALUES
(1, 'Boeing 787-9 Dreamliner', '4R-SLA', 210, 32, 8, 'ACTIVE'),
(2, 'Airbus A350-900', '4R-SLB', 240, 36, 12, 'ACTIVE'),
(3, 'Boeing 777-300ER', '4R-SLC', 260, 42, 14, 'ACTIVE'),
(4, 'Airbus A320neo', '4R-SLD', 160, 16, 0, 'ACTIVE');

-- 3. Users (30 attributes)
INSERT IGNORE INTO users (user_id, full_name, email, password_hash, phone_number, role, frequent_flyer_number, loyalty_points, loyalty_tier, title, first_name, last_name) VALUES
(1, 'Alex Morgan', 'alex@skyline.com', 'passenger123', '+1 555-0192', 'PASSENGER', 'SK-99482', 4500, 'Gold VIP', 'Mr', 'Alex', 'Morgan'),
(2, 'Samira Khan', 'officer@skyline.com', 'officer123', '+94 77 123 4567', 'TICKETING_OFFICER', NULL, 0, 'Staff Tier', 'Ms', 'Samira', 'Khan'),
(3, 'David Vance', 'admin@skyline.com', 'admin123', '+1 800-SKY-ADMIN', 'ADMIN', NULL, 0, 'Airline Admin', 'Mr', 'David', 'Vance'),
(4, 'Elena Rostova', 'hotel@skyline.com', 'hotel123', '+971 4 888 9999', 'HOTEL_MANAGER', NULL, 0, 'Hotel Partner', 'Ms', 'Elena', 'Rostova'),
(5, 'Alex Morgan', 'alex.morgan@skyline.com', 'passenger123', '+1 555-0192', 'PASSENGER', 'SL-8849201', 1450, 'Gold VIP', 'Mr', 'Alex', 'Morgan');

-- 4. Saved Payment Cards (10 attributes)
INSERT IGNORE INTO user_cards (card_id, user_id, card_type, card_holder, card_number_masked, last4, expiry, cvv, is_default) VALUES
(1, 1, 'Visa', 'Alex Morgan', '•••• •••• •••• 4242', '4242', '12/28', '382', TRUE),
(2, 1, 'Mastercard', 'Alex Morgan', '•••• •••• •••• 8819', '8819', '09/27', '912', FALSE),
(3, 5, 'Visa', 'Alex Morgan', '•••• •••• •••• 4242', '4242', '12/28', '382', TRUE);

-- 5. Flight Schedules (24 attributes)
INSERT IGNORE INTO flights (flight_id, flight_number, origin_code, destination_code, origin_city, destination_city, departure_time, arrival_time, duration, stops, has_layover, aircraft_id, aircraft_model, tail_number, base_price_economy, base_price_business, base_price_first, total_seats, available_seats, status, image) VALUES
(1, 'SL-101', 'CMB', 'SIN', 'Colombo', 'Singapore', '2026-09-25 08:30:00', '2026-09-25 15:00:00', '4h 00m', 0, FALSE, 1, 'Boeing 787-9 Dreamliner', '4R-SLA', 350.00, 850.00, 1500.00, 48, 42, 'ON_TIME', 'https://cdn.phototourl.com/free/2026-08-30-e4fac5db-76e3-445a-b51c-5af0d4fe8c97.png'),
(2, 'SL-204', 'CMB', 'LHR', 'Colombo', 'London', '2026-09-27 10:15:00', '2026-09-27 22:45:00', '15h 00m', 1, TRUE, 2, 'Airbus A350-900', '4R-SLB', 780.00, 1890.00, 3400.00, 60, 18, 'ON_TIME', 'https://cdn.phototourl.com/free/2026-08-30-9105feb9-f5b9-439f-a9bc-659511f337a3.png'),
(3, 'SL-308', 'CMB', 'DXB', 'Colombo', 'Dubai', '2026-09-23 14:20:00', '2026-09-23 17:35:00', '4h 45m', 0, FALSE, 3, 'Boeing 777-300ER', '4R-SLC', 480.00, 1100.00, 2100.00, 36, 29, 'ON_TIME', 'https://cdn.phototourl.com/free/2026-08-30-ded93e81-f57b-47a7-8b0c-d3a26a6b27d5.png'),
(4, 'SL-415', 'DXB', 'JFK', 'Dubai', 'New York', '2026-09-24 02:30:00', '2026-09-24 08:45:00', '14h 15m', 0, FALSE, 3, 'Boeing 777-300ER', '4R-SLC', 920.00, 2400.00, 4200.00, 60, 22, 'ON_TIME', 'https://images.unsplash.com/photo-1519074069444-1ba4eff56022?auto=format&fit=crop&w=800&q=80'),
(5, 'SL-520', 'CMB', 'HND', 'Colombo', 'Tokyo', '2026-09-26 23:15:00', '2026-09-27 09:30:00', '8h 45m', 0, FALSE, 1, 'Boeing 787-9 Dreamliner', '4R-SLA', 650.00, 1600.00, 2900.00, 48, 31, 'ON_TIME', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80');

-- 6. Reservations & Bookings (22 attributes) - Cleared / Empty Table
-- INSERT IGNORE INTO reservations (...) VALUES ...

-- 7. Passenger Details (12 attributes) - Cleared / Empty Table
-- INSERT IGNORE INTO passengers (...) VALUES ...

-- 8. Payment Transactions (7 attributes)
INSERT IGNORE INTO payments (payment_id, reservation_id, transaction_reference, payment_method, amount, payment_status) VALUES
(1, 1, 'TXN-9938102938', 'CREDIT_CARD', 780.00, 'SUCCESS'),
(2, 2, 'TXN-4491029911', 'PAYPAL', 850.00, 'SUCCESS');

-- 9. Ticket Cancellations & Refunds (14 attributes)
INSERT IGNORE INTO refund_requests (refund_id, refund_reference, pnr, reservation_id, user_name, user_email, flight_number, original_fare, cancellation_fee, refund_amount, reason, status) VALUES
(1, 'RF-88391', 'SK-991204', 1, 'Daniel Vance', 'daniel@example.com', 'SL-308', 480.00, 80.00, 400.00, 'Personal schedule change', 'APPROVED');

-- 10. Hotel Partners (11 attributes)
INSERT IGNORE INTO hotels (hotel_id, name, city, country, airport_code, star_rating, price_per_night, available_rooms, distance_km, complimentary_threshold_hours, shuttle_service, image) VALUES
(1, 'SkyHaven Airport Resort & Spa', 'Dubai', 'UAE', 'DXB', 5, 120.00, 35, 1.2, 8, TRUE, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'),
(2, 'Transit Grand Luxury Hotel', 'Singapore', 'Singapore', 'SIN', 5, 140.00, 20, 0.5, 8, TRUE, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80'),
(3, 'Heathrow Crown Plaza & Suites', 'London', 'United Kingdom', 'LHR', 5, 160.00, 28, 1.5, 8, TRUE, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'),
(4, 'TWA Hotel at JFK Airport', 'New York', 'USA', 'JFK', 5, 195.00, 22, 0.2, 8, TRUE, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80'),
(5, 'Haneda SkySuites Transit Hotel', 'Tokyo', 'Japan', 'HND', 4, 110.00, 18, 0.8, 8, TRUE, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'),
(6, 'Averin Transit Hotel Katunayake', 'Colombo', 'Sri Lanka', 'CMB', 4, 75.00, 30, 1.0, 8, TRUE, 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80'),
(7, 'Rydges Sydney Airport Hotel', 'Sydney', 'Australia', 'SYD', 4, 155.00, 25, 0.3, 8, TRUE, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80');

-- 11. Hotel Bookings (13 attributes)
INSERT IGNORE INTO hotel_bookings (hotel_booking_id, hotel_id, hotel_name, reservation_id, pnr_code, passenger_name, room_type, check_in_date, check_out_date, is_complimentary, amount, booking_status) VALUES
(1, 1, 'SkyHaven Airport Resort & Spa', 1, 'SK-784920', 'Alex Morgan', 'Deluxe Transit Suite', '2026-09-27', '2026-09-28', TRUE, 0.00, 'CONFIRMED');
