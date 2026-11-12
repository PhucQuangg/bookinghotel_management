package com.stu.edu.bookinghotel_management.repository;

import com.stu.edu.bookinghotel_management.entity.BookingExtraCost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingExtraCostRepository
        extends JpaRepository<BookingExtraCost, Long> {

    List<BookingExtraCost> findByBooking_Id(Long bookingId);

    Optional<BookingExtraCost> findByIdAndBooking_Id(
            Long id,
            Long bookingId
    );
}