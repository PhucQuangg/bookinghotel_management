package com.stu.edu.bookinghotel_management.repository;

import com.stu.edu.bookinghotel_management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User,Integer> {
    Optional<User> findByUsernameIgnoreCase(String username);

}
