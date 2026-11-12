package com.stu.edu.bookinghotel_management.repository;

import com.stu.edu.bookinghotel_management.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    Optional<Customer> findByEmail(String email);
    Optional<Customer> findByUser_Username(String username);
}
