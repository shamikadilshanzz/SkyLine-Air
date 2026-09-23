package com.skylineair.repository;

import com.skylineair.model.HotelBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HotelBookingRepository extends JpaRepository<HotelBooking, Long> {
    List<HotelBooking> findByPnrCode(String pnrCode);
    List<HotelBooking> findByUserId(Long userId);
    List<HotelBooking> findByGuestEmailIgnoreCase(String guestEmail);
    boolean existsByHotelId(Long hotelId);
}
