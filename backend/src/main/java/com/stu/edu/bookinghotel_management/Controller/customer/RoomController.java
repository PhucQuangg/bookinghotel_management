
package com.stu.edu.bookinghotel_management.controller;

import com.stu.edu.bookinghotel_management.dto.AvailableRoomDTO;
import com.stu.edu.bookinghotel_management.dto.RoomDTO;
import com.stu.edu.bookinghotel_management.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/customers/rooms")
@RequiredArgsConstructor

public class RoomController {

    private final RoomService roomService;

    @GetMapping("/available")
    public ResponseEntity<List<AvailableRoomDTO>> findAvailableRooms(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate checkInDate,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate checkOutDate,

            @RequestParam
                    Integer guestCount
    ) {
        List<AvailableRoomDTO> rooms =
                roomService.findAvailableRooms(
                        checkInDate,
                        checkOutDate,
                        guestCount
                );

        return ResponseEntity.ok(rooms);
    }

    @GetMapping
    public ResponseEntity<?> listRooms(){
        try {
            return ResponseEntity.ok(roomService.getAllRoom());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi tải danh sách phòng: " + e.getMessage());
        }
    }
}
