package com.stu.edu.bookinghotel_management.repository;

import com.stu.edu.bookinghotel_management.entity.Room;
import com.stu.edu.bookinghotel_management.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {

    @Query("""
        SELECT r
        FROM Room r
        JOIN FETCH r.roomType rt
        WHERE r.status = com.stu.edu.bookinghotel_management.entity.RoomStatus.VACANT
          AND rt.capacity >= :guestCount
          AND NOT EXISTS (
              SELECT br.id
              FROM BookingRoom br, Booking b
              WHERE br.bookingId = b.id
                AND br.roomId = r.id
                AND b.status IN :blockingStatuses
                AND b.checkInDate < :checkOutDate
                AND b.checkOutDate > :checkInDate
          )
        ORDER BY rt.basePrice ASC
        """)
    List<Room> findAvailableRooms(
            @Param("checkInDate") LocalDate checkInDate,
            @Param("checkOutDate") LocalDate checkOutDate,
            @Param("guestCount") Integer guestCount,
            @Param("blockingStatuses") List<BookingStatus> blockingStatuses
    );

    @Query("""
    SELECT r FROM Room r
    JOIN FETCH r.roomType rt
    WHERE r.status = com.stu.edu.bookinghotel_management.entity.RoomStatus.VACANT
      AND rt.capacity >= :guestCount

      AND NOT EXISTS (
          SELECT br.id
          FROM BookingRoom br, Booking b
          WHERE br.bookingId = b.id
            AND br.roomId = r.id
            AND b.id <> :excludeBookingId
            AND b.status IN :blockingStatuses
            AND COALESCE(br.checkInDate, b.checkInDate) < :checkOutDate
            AND COALESCE(br.checkOutDate, b.checkOutDate) > :checkInDate
      )

      AND NOT EXISTS (
          SELECT br2.id
          FROM BookingRoom br2
          WHERE br2.bookingId = :excludeBookingId
            AND br2.roomId = r.id
            AND COALESCE(br2.checkInDate, :checkInDate) < :checkOutDate
            AND COALESCE(br2.checkOutDate, :checkOutDate) > :checkInDate
      )

    ORDER BY rt.basePrice ASC
""")
    List<Room> findAvailableRoomsForAdmin(
            @Param("checkInDate") LocalDate checkInDate,
            @Param("checkOutDate") LocalDate checkOutDate,
            @Param("guestCount") Integer guestCount,
            @Param("blockingStatuses") List<BookingStatus> blockingStatuses,
            @Param("excludeBookingId") Long excludeBookingId
    );
}