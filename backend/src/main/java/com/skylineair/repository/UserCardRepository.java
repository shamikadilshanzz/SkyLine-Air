package com.skylineair.repository;

import com.skylineair.model.UserCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserCardRepository extends JpaRepository<UserCard, Long> {
    List<UserCard> findByUserId(Long userId);
    List<UserCard> findByUserIdIn(List<Long> userIds);
    List<UserCard> findByUserIdAndIsDefault(Long userId, Boolean isDefault);
}
