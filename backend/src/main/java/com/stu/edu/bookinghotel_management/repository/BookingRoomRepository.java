package com.stu.edu.bookinghotel_management.repository;

import com.stu.edu.bookinghotel_management.entity.BookingRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingRoomRepository
        extends JpaRepository<BookingRoom, Long> {

    List<BookingRoom> findByBookingId(Long bookingId);
}