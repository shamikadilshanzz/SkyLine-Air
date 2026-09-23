package com.skylineair.repository;

import com.skylineair.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    Optional<Reservation> findByPnrCode(String pnrCode);
    List<Reservation> findByUserId(Long userId);
    List<Reservation> findByUserEmail(String userEmail);
}
