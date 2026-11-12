package com.stu.edu.bookinghotel_management.repository;

import com.stu.edu.bookinghotel_management.entity.Booking;
import com.stu.edu.bookinghotel_management.entity.BookingStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByCustomer_User_UsernameOrderByCreatedAtDesc(
            String username
    );

    Optional<Booking> findByIdAndCustomer_User_Username(
            Long id,
            String username
    );

    List<Booking> findAllByOrderByCreatedAtDesc();

    @Query("""
        SELECT b
        FROM Booking b
        LEFT JOIN b.customer c
        WHERE
            (
                :keyword IS NULL
                OR LOWER(COALESCE(b.bookingCode, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(c.fullName, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(c.email, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(COALESCE(c.phone, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
            AND (:status IS NULL OR b.status = :status)
            AND (:checkInDate IS NULL OR b.checkInDate = :checkInDate)
        ORDER BY b.createdAt DESC
    """)
    List<Booking> searchAdminBookings(
            @Param("keyword") String keyword,
            @Param("status") BookingStatus status,
            @Param("checkInDate") LocalDate checkInDate
    );
}