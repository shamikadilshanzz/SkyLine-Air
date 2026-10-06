-- ============================================================================
-- SkyLine Air - Sample Data Population Script
-- Module: IT2140 Database Design and Development / SE2030 Software Engineering
-- Part C: Sample Data Insertion (At least 5 valid records per table respecting constraints)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Airports (7 records)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO airports (airport_code, airport_name, city, country) VALUES
('CMB', 'Bandaranaike International Airport', 'Colombo', 'Sri Lanka'),
('SIN', 'Singapore Changi Airport', 'Singapore', 'Singapore'),
('DXB', 'Dubai International Airport', 'Dubai', 'UAE'),
('LHR', 'London Heathrow Airport', 'London', 'United Kingdom'),
('JFK', 'John F. Kennedy International Airport', 'New York', 'USA'),
('HND', 'Tokyo Haneda Airport', 'Tokyo', 'Japan'),
('SYD', 'Sydney Kingsford Smith Airport', 'Sydney', 'Australia');

-- ----------------------------------------------------------------------------
-- 2. Aircraft Fleet (5 records)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO aircraft (aircraft_id, model, tail_number, economy_seats, business_seats, first_class_seats, status) VALUES
(1, 'Boeing 787-9 Dreamliner', '4R-SLA', 210, 32, 8, 'ACTIVE'),
(2, 'Airbus A350-900', '4R-SLB', 240, 36, 12, 'ACTIVE'),
(3, 'Boeing 777-300ER', '4R-SLC', 260, 42, 14, 'ACTIVE'),
(4, 'Airbus A320neo', '4R-SLD', 160, 16, 0, 'ACTIVE'),
(5, 'Airbus A330-300', '4R-SLE', 220, 28, 6, 'ACTIVE');

-- ----------------------------------------------------------------------------
-- 3. Users (6 records covering all ISA Subtypes: Passenger, Officer, Admin, Hotel Mgr)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO users (user_id, email, password_hash, phone_number, role, frequent_flyer_number, loyalty_points, loyalty_tier, title, first_name, last_name, nationality, country, city, address, postal_code, passport_number, passport_issuing_country) VALUES
(1, 'alex@skyline.com', 'passenger123', '+1 555-0192', 'PASSENGER', 'SK-99482', 4500, 'Gold VIP', 'Mr', 'Alex', 'Morgan', 'USA', 'USA', 'New York', '120 Broadway, Suite 1400', '10005', 'N9849201', 'USA'),
(2, 'officer@skyline.com', 'officer123', '+94 77 123 4567', 'TICKETING_OFFICER', NULL, 0, 'Staff Tier', 'Ms', 'Samira', 'Khan', 'Sri Lanka', 'Sri Lanka', 'Colombo', '45 Galle Road', '00300', 'N8829102', 'Sri Lanka'),
(3, 'admin@skyline.com', 'admin123', '+1 800-SKY-ADMIN', 'ADMIN', NULL, 0, 'Airline Admin', 'Mr', 'David', 'Vance', 'USA', 'USA', 'Chicago', '300 N Michigan Ave', '60601', 'N1192842', 'USA'),
(4, 'hotel@skyline.com', 'hotel123', '+971 4 888 9999', 'HOTEL_MANAGER', NULL, 0, 'Hotel Partner', 'Ms', 'Elena', 'Rostova', 'UAE', 'UAE', 'Dubai', 'Downtown Sheikh Zayed Rd', '00000', 'N4481029', 'UAE'),
(5, 'sarah.jenkins@skyline.com', 'passenger123', '+44 20 7946 0912', 'PASSENGER', 'SL-8849201', 2800, 'Silver Elite', 'Ms', 'Sarah', 'Jenkins', 'British', 'United Kingdom', 'London', '14 Oxford St', 'W1D 1BS', 'P3849102', 'United Kingdom'),
(6, 'chaminda.perera@skyline.com', 'passenger123', '+94 71 888 2345', 'PASSENGER', 'SL-7729103', 1200, 'Blue Standard', 'Mr', 'Chaminda', 'Perera', 'Sri Lankan', 'Sri Lanka', 'Kandy', '12 Peradeniya Road', '20000', 'N5528190', 'Sri Lanka');

-- ----------------------------------------------------------------------------
-- 4. Saved Payment Cards (5 records)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO user_cards (card_id, user_id, card_type, card_holder, card_number_masked, last4, expiry, cvv, is_default, created_at) VALUES
(1, 1, 'Visa', 'Alex Morgan', '•••• •••• •••• 4242', '4242', '12/28', '382', TRUE, '2026-09-01 10:00:00'),
(2, 1, 'Mastercard', 'Alex Morgan', '•••• •••• •••• 8819', '8819', '09/27', '912', FALSE, '2026-09-05 14:30:00'),
(3, 5, 'Visa', 'Sarah Jenkins', '•••• •••• •••• 1144', '1144', '04/29', '455', TRUE, '2026-09-10 09:15:00'),
(4, 6, 'Mastercard', 'Chaminda Perera', '•••• •••• •••• 5590', '5590', '11/26', '129', TRUE, '2026-09-12 16:45:00'),
(5, 5, 'Amex', 'Sarah Jenkins', '•••• •••••• •3005', '3005', '08/28', '8910', FALSE, '2026-09-15 11:20:00');

-- ----------------------------------------------------------------------------
-- 5. Flight Schedules (5 records)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO flights (flight_id, flight_number, origin_code, destination_code, origin_city, destination_city, departure_time, arrival_time, duration, stops, has_layover, aircraft_id, aircraft_model, tail_number, base_price_economy, base_price_business, base_price_first, total_seats, available_seats, status, image) VALUES
(1, 'SL-101', 'CMB', 'SIN', 'Colombo', 'Singapore', '2026-09-25 08:30:00', '2026-09-25 15:00:00', '4h 00m', 0, FALSE, 1, 'Boeing 787-9 Dreamliner', '4R-SLA', 350.00, 850.00, 1500.00, 48, 42, 'ON_TIME', 'https://images7.alphacoders.com/742/thumb-1920-742688.jpg'),
(2, 'SL-204', 'CMB', 'LHR', 'Colombo', 'London', '2026-09-27 10:15:00', '2026-09-27 22:45:00', '15h 00m', 1, TRUE, 2, 'Airbus A350-900', '4R-SLB', 780.00, 1890.00, 3400.00, 60, 18, 'ON_TIME', 'https://cdn.phototourl.com/free/2026-08-30-9105feb9-f5b9-439f-a9bc-659511f337a3.png'),
(3, 'SL-308', 'CMB', 'DXB', 'Colombo', 'Dubai', '2026-09-23 14:20:00', '2026-09-23 17:35:00', '4h 45m', 0, FALSE, 3, 'Boeing 777-300ER', '4R-SLC', 480.00, 1100.00, 2100.00, 36, 29, 'ON_TIME', 'https://cdn.phototourl.com/free/2026-08-30-ded93e81-f57b-47a7-8b0c-d3a26a6b27d5.png'),
(4, 'SL-415', 'DXB', 'JFK', 'Dubai', 'New York', '2026-09-24 02:30:00', '2026-09-24 08:45:00', '14h 15m', 0, FALSE, 3, 'Boeing 777-300ER', '4R-SLC', 920.00, 2400.00, 4200.00, 60, 22, 'ON_TIME', 'https://images.unsplash.com/photo-1519074069444-1ba4eff56022?auto=format&fit=crop&w=800&q=80'),
(5, 'SL-520', 'CMB', 'HND', 'Colombo', 'Tokyo', '2026-09-26 23:15:00', '2026-09-27 09:30:00', '8h 45m', 0, FALSE, 1, 'Boeing 787-9 Dreamliner', '4R-SLA', 650.00, 1600.00, 2900.00, 48, 31, 'ON_TIME', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80');

-- ----------------------------------------------------------------------------
-- 6. Hotel Partners (7 records)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO hotels (hotel_id, name, city, country, airport_code, star_rating, price_per_night, available_rooms, distance_km, complimentary_threshold_hours, shuttle_service, image, amenities) VALUES
(1, 'SkyHaven Airport Resort & Spa', 'Dubai', 'UAE', 'DXB', 5, 120.00, 35, 1.2, 8, TRUE, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80', 'Free Shuttle 24/7, Buffet Breakfast, Rooftop Pool, Executive Lounge, High-Speed Wi-Fi'),
(2, 'Transit Grand Luxury Hotel', 'Singapore', 'Singapore', 'SIN', 5, 140.00, 20, 0.5, 8, TRUE, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80', 'Direct Terminal Access, Nap Pods, Fitness Center, Free Breakfast, Express Check-In'),
(3, 'Heathrow Crown Plaza & Suites', 'London', 'United Kingdom', 'LHR', 5, 160.00, 28, 1.5, 8, TRUE, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', 'Free 24/7 Heathrow Express Shuttle, British Gourmet Breakfast, Spa & Heated Pool, High-Speed Wi-Fi'),
(4, 'TWA Hotel at JFK Airport', 'New York', 'USA', 'JFK', 5, 195.00, 22, 0.2, 8, TRUE, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80', 'Runway-View Rooftop Pool, Direct AirTrain Access, 24/7 Dining, Ultra-Quiet Rooms'),
(5, 'Haneda SkySuites Transit Hotel', 'Tokyo', 'Japan', 'HND', 4, 110.00, 18, 0.8, 8, TRUE, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', 'Onsen Natural Hot Spring, Airport Shuttle, Traditional Bento Breakfast, Quiet Sleep Pods'),
(6, 'Averin Transit Hotel Katunayake', 'Colombo', 'Sri Lanka', 'CMB', 4, 75.00, 30, 1.0, 8, TRUE, 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80', 'Complimentary Airport Transfer, Ceylon Tea Lounge, Outdoor Pool, 24/7 Room Service'),
(7, 'Rydges Sydney Airport Hotel', 'Sydney', 'Australia', 'SYD', 4, 155.00, 25, 0.3, 8, TRUE, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80', 'Terminal Walkway Connection, Rooftop Bar, Complimentary Breakfast, Fitness Center');

-- ----------------------------------------------------------------------------
-- 7. Reservations & Bookings (5 records)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO reservations (reservation_id, pnr_code, user_id, user_name, user_email, flight_id, flight_number, origin, destination, departure_time, cabin_class, total_amount, booking_status, payment_status, payment_method, transaction_ref, has_layover, hotel_booked, hotel_id, hotel_name, hotel_city, hotel_price) VALUES
(1, 'SK-991201', 1, 'Alex Morgan', 'alex@skyline.com', 1, 'SL-101', 'Colombo', 'Singapore', '2026-09-25 08:30:00', 'ECONOMY', 350.00, 'CONFIRMED', 'PAID', 'CREDIT_CARD', 'TXN-9938102938', FALSE, FALSE, NULL, NULL, NULL, 0.00),
(2, 'SK-991202', 1, 'Alex Morgan', 'alex@skyline.com', 2, 'SL-204', 'Colombo', 'London', '2026-09-27 10:15:00', 'BUSINESS', 1890.00, 'CONFIRMED', 'PAID', 'PAYPAL', 'TXN-4491029911', TRUE, TRUE, 3, 'Heathrow Crown Plaza & Suites', 'London', 160.00),
(3, 'SK-991203', 5, 'Sarah Jenkins', 'sarah.jenkins@skyline.com', 3, 'SL-308', 'Colombo', 'Dubai', '2026-09-23 14:20:00', 'ECONOMY', 480.00, 'CONFIRMED', 'PAID', 'CREDIT_CARD', 'TXN-7718293012', FALSE, TRUE, 1, 'SkyHaven Airport Resort & Spa', 'Dubai', 0.00),
(4, 'SK-991204', 6, 'Chaminda Perera', 'chaminda.perera@skyline.com', 4, 'SL-415', 'Dubai', 'New York', '2026-09-24 02:30:00', 'FIRST', 4200.00, 'CANCELLED', 'REFUNDED', 'CREDIT_CARD', 'TXN-8829104812', FALSE, FALSE, NULL, NULL, NULL, 0.00),
(5, 'SK-991205', 5, 'Sarah Jenkins', 'sarah.jenkins@skyline.com', 5, 'SL-520', 'Colombo', 'Tokyo', '2026-09-26 23:15:00', 'BUSINESS', 1600.00, 'PENDING_PAYMENT', 'PENDING', 'CREDIT_CARD', 'TXN-1192837465', FALSE, FALSE, NULL, NULL, NULL, 0.00);

-- ----------------------------------------------------------------------------
-- 8. Passenger Details (Weak Entity - 5 records)
-- Composite PK: (reservation_id, passenger_id)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO passengers (reservation_id, passenger_id, title, first_name, last_name, dob, passport_number, nationality, seat_number, cabin_class, meal_preference, extra_baggage_kg) VALUES
(1, 1, 'Mr', 'Alex', 'Morgan', '1990-05-14', 'N9849201', 'USA', '12A', 'ECONOMY', 'Standard Gourmet', 0),
(2, 1, 'Mr', 'Alex', 'Morgan', '1990-05-14', 'N9849201', 'USA', '02B', 'BUSINESS', 'Asian Vegetarian', 10),
(3, 1, 'Ms', 'Sarah', 'Jenkins', '1992-08-20', 'P3849102', 'British', '14C', 'ECONOMY', 'Halal Meal', 5),
(4, 1, 'Mr', 'Chaminda', 'Perera', '1988-11-03', 'N5528190', 'Sri Lankan', '01A', 'FIRST', 'Seafood Delight', 20),
(5, 1, 'Ms', 'Sarah', 'Jenkins', '1992-08-20', 'P3849102', 'British', '03F', 'BUSINESS', 'Low Sodium Meal', 0);

-- ----------------------------------------------------------------------------
-- 9. Payment Transactions (5 records)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO payments (payment_id, reservation_id, transaction_reference, payment_method, amount, payment_status) VALUES
(1, 1, 'TXN-9938102938', 'CREDIT_CARD', 350.00, 'SUCCESS'),
(2, 2, 'TXN-4491029911', 'PAYPAL', 2050.00, 'SUCCESS'),
(3, 3, 'TXN-7718293012', 'CREDIT_CARD', 480.00, 'SUCCESS'),
(4, 4, 'TXN-8829104812', 'CREDIT_CARD', 4200.00, 'REFUNDED'),
(5, 5, 'TXN-1192837465', 'CREDIT_CARD', 1600.00, 'PENDING');

-- ----------------------------------------------------------------------------
-- 10. Ticket Cancellations & Refunds (5 records)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO refund_requests (refund_id, refund_reference, pnr, reservation_id, user_name, user_email, flight_number, original_fare, cancellation_fee, refund_amount, reason, status, requested_date, processed_at) VALUES
(1, 'RF-88391', 'SK-991204', 4, 'Chaminda Perera', 'chaminda.perera@skyline.com', 'SL-415', 4200.00, 300.00, 3900.00, 'Personal schedule change', 'APPROVED', '2026-09-24 08:15:00', '2026-09-24 10:30:00'),
(2, 'RF-88392', 'SK-991201', 1, 'Alex Morgan', 'alex@skyline.com', 'SL-101', 350.00, 50.00, 300.00, 'Medical emergency', 'REJECTED', '2026-09-25 09:40:00', '2026-09-25 11:15:00'),
(3, 'RF-88393', 'SK-991202', 2, 'Alex Morgan', 'alex@skyline.com', 'SL-204', 1890.00, 150.00, 1740.00, 'Visa issuance delay', 'PENDING', '2026-09-27 12:00:00', NULL),
(4, 'RF-88394', 'SK-991203', 3, 'Sarah Jenkins', 'sarah.jenkins@skyline.com', 'SL-308', 480.00, 50.00, 430.00, 'Flight time rescheduled by passenger', 'APPROVED', '2026-09-23 16:30:00', '2026-09-23 17:45:00'),
(5, 'RF-88395', 'SK-991205', 5, 'Sarah Jenkins', 'sarah.jenkins@skyline.com', 'SL-520', 1600.00, 100.00, 1500.00, 'Duplicate booking made by error', 'PENDING', '2026-09-26 14:10:00', NULL);

-- ----------------------------------------------------------------------------
-- 11. Hotel Bookings (5 records)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO hotel_bookings (hotel_booking_id, hotel_id, hotel_name, user_id, guest_email, voucher_code, reservation_id, pnr_code, passenger_name, room_type, check_in_date, check_out_date, is_complimentary, amount, booking_status) VALUES
(1, 1, 'SkyHaven Airport Resort & Spa', 1, 'alex@skyline.com', 'VCH-DXB-101', 1, 'SK-991201', 'Alex Morgan', 'Deluxe Transit Suite', '2026-09-25', '2026-09-26', TRUE, 0.00, 'CONFIRMED'),
(2, 3, 'Heathrow Crown Plaza & Suites', 1, 'alex@skyline.com', 'VCH-LHR-204', 2, 'SK-991202', 'Alex Morgan', 'Executive King Suite', '2026-09-27', '2026-09-28', FALSE, 160.00, 'CONFIRMED'),
(3, 1, 'SkyHaven Airport Resort & Spa', 5, 'sarah.jenkins@skyline.com', 'VCH-DXB-308', 3, 'SK-991203', 'Sarah Jenkins', 'Deluxe Transit Suite', '2026-09-23', '2026-09-24', TRUE, 0.00, 'CONFIRMED'),
(4, 2, 'Transit Grand Luxury Hotel', 6, 'chaminda.perera@skyline.com', 'VCH-SIN-415', 4, 'SK-991204', 'Chaminda Perera', 'Standard Transit Room', '2026-09-24', '2026-09-25', FALSE, 140.00, 'CANCELLED'),
(5, 5, 'Haneda SkySuites Transit Hotel', 5, 'sarah.jenkins@skyline.com', 'VCH-HND-520', 5, 'SK-991205', 'Sarah Jenkins', 'Traditional Tatami Suite', '2026-09-26', '2026-09-27', FALSE, 110.00, 'CONFIRMED');

-- ----------------------------------------------------------------------------
-- 12. Flight Price Alerts & Saved Searches (5 records)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO price_alerts (alert_id, user_id, user_email, origin_code, origin_city, destination_code, destination_city, target_price, cabin_class, frequency, status) VALUES
(1, 1, 'alex@skyline.com', 'CMB', 'Colombo', 'SIN', 'Singapore', 300.00, 'ECONOMY', 'INSTANT', 'ACTIVE'),
(2, 1, 'alex@skyline.com', 'CMB', 'Colombo', 'LHR', 'London', 700.00, 'BUSINESS', 'DAILY', 'ACTIVE'),
(3, 5, 'sarah.jenkins@skyline.com', 'DXB', 'Dubai', 'JFK', 'New York', 850.00, 'ECONOMY', 'WEEKLY', 'ACTIVE'),
(4, 6, 'chaminda.perera@skyline.com', 'CMB', 'Colombo', 'HND', 'Tokyo', 600.00, 'ECONOMY', 'INSTANT', 'PAUSED'),
(5, 5, 'sarah.jenkins@skyline.com', 'CMB', 'Colombo', 'DXB', 'Dubai', 400.00, 'ECONOMY', 'DAILY', 'ACTIVE');
