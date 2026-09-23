package com.skylineair.config;

import com.skylineair.model.*;
import com.skylineair.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final AirportRepository airportRepository;
    private final AircraftRepository aircraftRepository;
    private final FlightRepository flightRepository;
    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final RefundRequestRepository refundRequestRepository;
    private final UserCardRepository userCardRepository;
    private final ReservationRepository reservationRepository;

    public DataInitializer(AirportRepository airportRepository,
                           AircraftRepository aircraftRepository,
                           FlightRepository flightRepository,
                           UserRepository userRepository,
                           HotelRepository hotelRepository,
                           RefundRequestRepository refundRequestRepository,
                           UserCardRepository userCardRepository,
                           ReservationRepository reservationRepository) {
        this.airportRepository = airportRepository;
        this.aircraftRepository = aircraftRepository;
        this.flightRepository = flightRepository;
        this.userRepository = userRepository;
        this.hotelRepository = hotelRepository;
        this.refundRequestRepository = refundRequestRepository;
        this.userCardRepository = userCardRepository;
        this.reservationRepository = reservationRepository;
    }

    @Override
    public void run(String... args) {
        // Seed Airports
        if (airportRepository.count() == 0) {
            airportRepository.save(new Airport("CMB", "Bandaranaike International Airport", "Colombo", "Sri Lanka"));
            airportRepository.save(new Airport("SIN", "Singapore Changi Airport", "Singapore", "Singapore"));
            airportRepository.save(new Airport("DXB", "Dubai International Airport", "Dubai", "UAE"));
            airportRepository.save(new Airport("LHR", "London Heathrow Airport", "London", "United Kingdom"));
            airportRepository.save(new Airport("JFK", "John F. Kennedy International Airport", "New York", "USA"));
            airportRepository.save(new Airport("HND", "Tokyo Haneda Airport", "Tokyo", "Japan"));
            airportRepository.save(new Airport("SYD", "Sydney Kingsford Smith Airport", "Sydney", "Australia"));
        }

        // Seed Aircraft
        if (aircraftRepository.count() == 0) {
            aircraftRepository.save(new Aircraft(null, "Boeing 787-9 Dreamliner", "4R-SLA", 210, 32, 8, "ACTIVE"));
            aircraftRepository.save(new Aircraft(null, "Airbus A350-900", "4R-SLB", 240, 36, 12, "ACTIVE"));
            aircraftRepository.save(new Aircraft(null, "Boeing 777-300ER", "4R-SLC", 260, 42, 14, "ACTIVE"));
            aircraftRepository.save(new Aircraft(null, "Airbus A320neo", "4R-SLD", 160, 16, 0, "ACTIVE"));
        }

        // Seed Users
        if (userRepository.count() == 0) {
            User passenger = new User();
            passenger.setFullName("Alex Morgan");
            passenger.setEmail("passenger@skyline.com");
            passenger.setPasswordHash("passenger123");
            passenger.setPhoneNumber("+1 555-0192");
            passenger.setRole("PASSENGER");
            passenger.setTitle("Mr");
            passenger.setFirstName("Alex");
            passenger.setLastName("Morgan");
            passenger.setLoyaltyTier("Gold VIP");
            passenger.setLoyaltyPoints(1450);
            passenger.setFrequentFlyerNumber("SL-8849201");
            userRepository.save(passenger);

            User officer = new User();
            officer.setFullName("Samira Khan");
            officer.setEmail("officer@skyline.com");
            officer.setPasswordHash("officer123");
            officer.setPhoneNumber("+94 77 123 4567");
            officer.setRole("TICKETING_OFFICER");
            officer.setFirstName("Samira");
            officer.setLastName("Khan");
            userRepository.save(officer);

            User admin = new User();
            admin.setFullName("David Vance");
            admin.setEmail("admin@skyline.com");
            admin.setPasswordHash("admin123");
            admin.setPhoneNumber("+1 800-SKY-ADMIN");
            admin.setRole("ADMIN");
            admin.setFirstName("David");
            admin.setLastName("Vance");
            userRepository.save(admin);

            User hotelManager = new User();
            hotelManager.setFullName("Elena Rostova");
            hotelManager.setEmail("hotel@skyline.com");
            hotelManager.setPasswordHash("hotel123");
            hotelManager.setPhoneNumber("+971 4 888 9999");
            hotelManager.setRole("HOTEL_MANAGER");
            hotelManager.setFirstName("Elena");
            hotelManager.setLastName("Rostova");
            userRepository.save(hotelManager);

            User alex = new User();
            alex.setFullName("Alex Morgan");
            alex.setEmail("alex.morgan@skyline.com");
            alex.setPasswordHash("passenger123");
            alex.setPhoneNumber("+1 555-0192");
            alex.setRole("PASSENGER");
            alex.setFirstName("Alex");
            alex.setLastName("Morgan");
            userRepository.save(alex);
        }

        // Seed Flights
        if (flightRepository.count() == 0) {
            Flight f1 = new Flight();
            f1.setFlightNumber("SL-101");
            f1.setOriginCode("CMB");
            f1.setDestinationCode("SIN");
            f1.setOriginCity("Colombo");
            f1.setDestinationCity("Singapore");
            f1.setDepartureTime(LocalDateTime.now().plusDays(5).withHour(8).withMinute(30));
            f1.setArrivalTime(LocalDateTime.now().plusDays(5).withHour(15).withMinute(0));
            f1.setDuration("4h 00m");
            f1.setStops(0);
            f1.setHasLayover(false);
            f1.setAircraftModel("Boeing 787-9 Dreamliner");
            f1.setTailNumber("4R-SLA");
            f1.setBasePriceEconomy(new BigDecimal("350.00"));
            f1.setBasePriceBusiness(new BigDecimal("850.00"));
            f1.setBasePriceFirst(new BigDecimal("1500.00"));
            f1.setTotalSeats(48);
            f1.setAvailableSeats(42);
            f1.setStatus("ON_TIME");
            f1.setImage("https://cdn.phototourl.com/free/2026-08-30-e4fac5db-76e3-445a-b51c-5af0d4fe8c97.png");
            flightRepository.save(f1);

            Flight f2 = new Flight();
            f2.setFlightNumber("SL-204");
            f2.setOriginCode("CMB");
            f2.setDestinationCode("LHR");
            f2.setOriginCity("Colombo");
            f2.setDestinationCity("London");
            f2.setDepartureTime(LocalDateTime.now().plusDays(7).withHour(10).withMinute(15));
            f2.setArrivalTime(LocalDateTime.now().plusDays(7).withHour(22).withMinute(45));
            f2.setDuration("15h 00m");
            f2.setStops(1);
            f2.setHasLayover(true);
            f2.setLayoverAirport("DXB");
            f2.setLayoverCity("Dubai");
            f2.setLayoverDurationHours(8.5);
            f2.setAircraftModel("Airbus A350-900");
            f2.setTailNumber("4R-SLB");
            f2.setBasePriceEconomy(new BigDecimal("780.00"));
            f2.setBasePriceBusiness(new BigDecimal("1890.00"));
            f2.setBasePriceFirst(new BigDecimal("3400.00"));
            f2.setTotalSeats(60);
            f2.setAvailableSeats(18);
            f2.setStatus("ON_TIME");
            f2.setImage("https://cdn.phototourl.com/free/2026-08-30-9105feb9-f5b9-439f-a9bc-659511f337a3.png");
            flightRepository.save(f2);

            Flight f3 = new Flight();
            f3.setFlightNumber("SL-308");
            f3.setOriginCode("CMB");
            f3.setDestinationCode("DXB");
            f3.setOriginCity("Colombo");
            f3.setDestinationCity("Dubai");
            f3.setDepartureTime(LocalDateTime.now().plusDays(3).withHour(14).withMinute(20));
            f3.setArrivalTime(LocalDateTime.now().plusDays(3).withHour(17).withMinute(35));
            f3.setDuration("4h 45m");
            f3.setStops(0);
            f3.setHasLayover(false);
            f3.setAircraftModel("Boeing 777-300ER");
            f3.setTailNumber("4R-SLC");
            f3.setBasePriceEconomy(new BigDecimal("480.00"));
            f3.setBasePriceBusiness(new BigDecimal("1100.00"));
            f3.setBasePriceFirst(new BigDecimal("2100.00"));
            f3.setTotalSeats(36);
            f3.setAvailableSeats(29);
            f3.setStatus("ON_TIME");
            f3.setImage("https://cdn.phototourl.com/free/2026-08-30-ded93e81-f57b-47a7-8b0c-d3a26a6b27d5.png");
            flightRepository.save(f3);

            Flight f4 = new Flight();
            f4.setFlightNumber("SL-415");
            f4.setOriginCode("DXB");
            f4.setDestinationCode("JFK");
            f4.setOriginCity("Dubai");
            f4.setDestinationCity("New York");
            f4.setDepartureTime(LocalDateTime.now().plusDays(4).withHour(2).withMinute(30));
            f4.setArrivalTime(LocalDateTime.now().plusDays(4).withHour(8).withMinute(45));
            f4.setDuration("14h 15m");
            f4.setStops(0);
            f4.setHasLayover(false);
            f4.setAircraftModel("Boeing 777-300ER");
            f4.setTailNumber("4R-SLC");
            f4.setBasePriceEconomy(new BigDecimal("920.00"));
            f4.setBasePriceBusiness(new BigDecimal("2400.00"));
            f4.setBasePriceFirst(new BigDecimal("4200.00"));
            f4.setTotalSeats(60);
            f4.setAvailableSeats(22);
            f4.setStatus("ON_TIME");
            f4.setImage("https://images.unsplash.com/photo-1519074069444-1ba4eff56022?auto=format&fit=crop&w=800&q=80");
            flightRepository.save(f4);

            Flight f5 = new Flight();
            f5.setFlightNumber("SL-520");
            f5.setOriginCode("CMB");
            f5.setDestinationCode("HND");
            f5.setOriginCity("Colombo");
            f5.setDestinationCity("Tokyo");
            f5.setDepartureTime(LocalDateTime.now().plusDays(6).withHour(23).withMinute(15));
            f5.setArrivalTime(LocalDateTime.now().plusDays(7).withHour(9).withMinute(30));
            f5.setDuration("8h 45m");
            f5.setStops(0);
            f5.setHasLayover(false);
            f5.setAircraftModel("Boeing 787-9 Dreamliner");
            f5.setTailNumber("4R-SLA");
            f5.setBasePriceEconomy(new BigDecimal("650.00"));
            f5.setBasePriceBusiness(new BigDecimal("1600.00"));
            f5.setBasePriceFirst(new BigDecimal("2900.00"));
            f5.setTotalSeats(48);
            f5.setAvailableSeats(31);
            f5.setStatus("ON_TIME");
            f5.setImage("https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80");
            flightRepository.save(f5);
        }

        // Seed Hotels
        if (hotelRepository.count() == 0) {
            Hotel h1 = new Hotel();
            h1.setName("SkyHaven Airport Resort & Spa");
            h1.setAirportCode("DXB");
            h1.setCity("Dubai");
            h1.setCountry("UAE");
            h1.setStarRating(5);
            h1.setPricePerNight(new BigDecimal("120.00"));
            h1.setComplimentaryThresholdHours(8);
            h1.setAvailableRooms(35);
            h1.setDistanceKm(1.2);
            h1.setShuttleService(true);
            h1.setImage("https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80");
            hotelRepository.save(h1);

            Hotel h2 = new Hotel();
            h2.setName("Transit Grand Luxury Hotel");
            h2.setAirportCode("SIN");
            h2.setCity("Singapore");
            h2.setCountry("Singapore");
            h2.setStarRating(5);
            h2.setPricePerNight(new BigDecimal("140.00"));
            h2.setComplimentaryThresholdHours(8);
            h2.setAvailableRooms(20);
            h2.setDistanceKm(0.5);
            h2.setShuttleService(true);
            h2.setImage("https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80");
            hotelRepository.save(h2);

            Hotel h3 = new Hotel();
            h3.setName("Heathrow Crown Plaza & Suites");
            h3.setAirportCode("LHR");
            h3.setCity("London");
            h3.setCountry("United Kingdom");
            h3.setStarRating(5);
            h3.setPricePerNight(new BigDecimal("160.00"));
            h3.setComplimentaryThresholdHours(8);
            h3.setAvailableRooms(28);
            h3.setDistanceKm(1.5);
            h3.setShuttleService(true);
            h3.setImage("https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80");
            hotelRepository.save(h3);

            Hotel h4 = new Hotel();
            h4.setName("TWA Hotel at JFK Airport");
            h4.setAirportCode("JFK");
            h4.setCity("New York");
            h4.setCountry("USA");
            h4.setStarRating(5);
            h4.setPricePerNight(new BigDecimal("195.00"));
            h4.setComplimentaryThresholdHours(8);
            h4.setAvailableRooms(22);
            h4.setDistanceKm(0.2);
            h4.setShuttleService(true);
            h4.setImage("https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80");
            hotelRepository.save(h4);

            Hotel h5 = new Hotel();
            h5.setName("Haneda SkySuites Transit Hotel");
            h5.setAirportCode("HND");
            h5.setCity("Tokyo");
            h5.setCountry("Japan");
            h5.setStarRating(4);
            h5.setPricePerNight(new BigDecimal("110.00"));
            h5.setComplimentaryThresholdHours(8);
            h5.setAvailableRooms(18);
            h5.setDistanceKm(0.8);
            h5.setShuttleService(true);
            h5.setImage("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80");
            hotelRepository.save(h5);

            Hotel h6 = new Hotel();
            h6.setName("Averin Transit Hotel Katunayake");
            h6.setAirportCode("CMB");
            h6.setCity("Colombo");
            h6.setCountry("Sri Lanka");
            h6.setStarRating(4);
            h6.setPricePerNight(new BigDecimal("75.00"));
            h6.setComplimentaryThresholdHours(8);
            h6.setAvailableRooms(30);
            h6.setDistanceKm(1.0);
            h6.setShuttleService(true);
            h6.setImage("https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80");
            hotelRepository.save(h6);

            Hotel h7 = new Hotel();
            h7.setName("Rydges Sydney Airport Hotel");
            h7.setAirportCode("SYD");
            h7.setCity("Sydney");
            h7.setCountry("Australia");
            h7.setStarRating(4);
            h7.setPricePerNight(new BigDecimal("155.00"));
            h7.setComplimentaryThresholdHours(8);
            h7.setAvailableRooms(25);
            h7.setDistanceKm(0.3);
            h7.setShuttleService(true);
            h7.setImage("https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80");
            hotelRepository.save(h7);
        } else {
            // Update existing hotels to ensure country field is populated
            hotelRepository.findAll().forEach(hotel -> {
                if (hotel.getCountry() == null || hotel.getCountry().isEmpty()) {
                    if ("DXB".equalsIgnoreCase(hotel.getAirportCode())) hotel.setCountry("UAE");
                    else if ("SIN".equalsIgnoreCase(hotel.getAirportCode())) hotel.setCountry("Singapore");
                    else if ("LHR".equalsIgnoreCase(hotel.getAirportCode())) hotel.setCountry("United Kingdom");
                    else if ("JFK".equalsIgnoreCase(hotel.getAirportCode())) hotel.setCountry("USA");
                    else if ("HND".equalsIgnoreCase(hotel.getAirportCode())) hotel.setCountry("Japan");
                    else if ("CMB".equalsIgnoreCase(hotel.getAirportCode())) hotel.setCountry("Sri Lanka");
                    else if ("SYD".equalsIgnoreCase(hotel.getAirportCode())) hotel.setCountry("Australia");
                    hotelRepository.save(hotel);
                }
            });
        }

        // Seed Refunds
        if (refundRequestRepository.count() == 0) {
            RefundRequest rr = new RefundRequest();
            rr.setRefundReference("RF-88391");
            rr.setPnr("SK-991204");
            rr.setUserName("Daniel Vance");
            rr.setUserEmail("daniel@example.com");
            rr.setFlightNumber("SL-308");
            rr.setOriginalFare(new BigDecimal("480.00"));
            rr.setCancellationFee(new BigDecimal("80.00"));
            rr.setRefundAmount(new BigDecimal("400.00"));
            rr.setReason("Personal schedule change");
            rr.setStatus("APPROVED");
            refundRequestRepository.save(rr);
        }

        // Seed User Cards
        if (userCardRepository.count() == 0) {
            userRepository.findByEmail("alex.morgan@skyline.com").ifPresent(user -> {
                UserCard c1 = new UserCard(null, user.getUserId(), "Visa", "Alex Morgan", "•••• •••• •••• 4242", "4242", "12/28", "382", true, LocalDateTime.now());
                UserCard c2 = new UserCard(null, user.getUserId(), "Mastercard", "Alex Morgan", "•••• •••• •••• 8819", "8819", "09/27", "912", false, LocalDateTime.now());
                userCardRepository.save(c1);
                userCardRepository.save(c2);
            });
            userRepository.findByEmail("passenger@skyline.com").ifPresent(user -> {
                UserCard c1 = new UserCard(null, user.getUserId(), "Visa", "Alex Morgan", "•••• •••• •••• 4242", "4242", "12/28", "382", true, LocalDateTime.now());
                userCardRepository.save(c1);
            });
        }

        // Seed Reservations
        if (reservationRepository.count() == 0) {
            userRepository.findByEmail("alex.morgan@skyline.com").ifPresent(user -> {
                Reservation r1 = new Reservation();
                r1.setPnrCode("SK-784920");
                r1.setUserId(user.getUserId());
                r1.setUserName(user.getFullName());
                r1.setUserEmail(user.getEmail());
                r1.setFlightNumber("SL-204");
                r1.setOrigin("CMB");
                r1.setDestination("LHR");
                r1.setDepartureTime("2026-09-10T10:15:00");
                r1.setCabinClass("ECONOMY");
                r1.setTotalAmount(new BigDecimal("780.00"));
                r1.setBookingStatus("CONFIRMED");
                r1.setPaymentStatus("PAID");
                r1.setPaymentMethod("CREDIT_CARD");
                r1.setTransactionRef("TXN-9938102938");
                r1.setHasLayover(true);
                r1.setLayoverCity("Dubai");
                r1.setLayoverAirport("DXB");
                r1.setLayoverDurationHours(8.5);

                Passenger p1 = new Passenger(null, "Mr", "Alex", "Morgan", "1992-05-14", "N9849201", "Sri Lanka", "14A", "ECONOMY", "Vegetarian", 5);
                r1.getPassengers().add(p1);
                reservationRepository.save(r1);
            });
        }

        System.out.println("✅ DataInitializer: Database successfully seeded with default Airports, Aircraft, Users, Flights, Hotels, and Refunds!");
    }
}
