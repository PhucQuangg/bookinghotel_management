package com.stu.edu.bookinghotel_management.Controller.admin;

import com.stu.edu.bookinghotel_management.dto.AvailableRoomDTO;
import com.stu.edu.bookinghotel_management.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminRoomController {

    private final BookingService bookingService;

    @GetMapping("/room-types")
    public ResponseEntity<List<AvailableRoomDTO>> getAllRoomTypes() {
        return ResponseEntity.ok(
                bookingService.getAllRoomTypesForAdmin()
        );
    }
    @GetMapping("/{bookingId}/available-rooms")
    public ResponseEntity<List<AvailableRoomDTO>> getAvailableRooms(
            @PathVariable Long bookingId,
            @RequestParam Long roomTypeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate checkInDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate checkOutDate,
            @RequestParam Integer guestCount
    ) {
        return ResponseEntity.ok(
                bookingService.getAvailableRoomsForAdmin(
                        bookingId,
                        roomTypeId,
                        checkInDate,
                        checkOutDate,
                        guestCount
                )
        );
    }

}
