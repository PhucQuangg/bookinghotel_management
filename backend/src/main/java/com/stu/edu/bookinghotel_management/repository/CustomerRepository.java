package com.stu.edu.bookinghotel_management.repository;

import com.stu.edu.bookinghotel_management.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Integer> {

    Optional<Customer> findByEmail(String email);

    Optional<Customer> findByUser_Username(String username);

    @Query("""
        SELECT c
        FROM Customer c
        LEFT JOIN c.user u
        WHERE
            :keyword IS NULL
            OR LOWER(c.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(c.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR c.phone LIKE CONCAT('%', :keyword, '%')
            OR LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
        """)
    Page<Customer> searchCustomers(
            @Param("keyword") String keyword,
            Pageable pageable
    );
}