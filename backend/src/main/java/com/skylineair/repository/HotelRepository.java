package com.skylineair.repository;

import com.skylineair.model.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HotelRepository extends JpaRepository<Hotel, Long> {
    List<Hotel> findByAirportCode(String airportCode);
    List<Hotel> findByAirportCodeIgnoreCase(String airportCode);
    List<Hotel> findByCountryIgnoreCase(String country);
    List<Hotel> findByCityIgnoreCase(String city);
}
