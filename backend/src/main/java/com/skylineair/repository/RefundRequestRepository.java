package com.skylineair.repository;

import com.skylineair.model.RefundRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefundRequestRepository extends JpaRepository<RefundRequest, Long> {
    Optional<RefundRequest> findByRefundReference(String refundReference);
    List<RefundRequest> findByUserEmail(String userEmail);
    List<RefundRequest> findByPnr(String pnr);
}
