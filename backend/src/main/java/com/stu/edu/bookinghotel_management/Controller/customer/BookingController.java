package com.stu.edu.bookinghotel_management.controller.customer;

import com.stu.edu.bookinghotel_management.dto.BookingCreatedDTO;
import com.stu.edu.bookinghotel_management.dto.BookingDetailDTO;
import com.stu.edu.bookinghotel_management.dto.BookingHistoryDTO;
import com.stu.edu.bookinghotel_management.dto.BookingRequestDTO;
import com.stu.edu.bookinghotel_management.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<List<BookingHistoryDTO>> getMyBookings(
            @AuthenticationPrincipal UserDetails userDetails) {

        List<BookingHistoryDTO> bookings =
                bookingService.getMyBookings(userDetails.getUsername());

        return ResponseEntity.ok(bookings);
    }
    @GetMapping("/{id}")
    public ResponseEntity<BookingDetailDTO> getBookingDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(
                bookingService.getBookingDetail(
                        id,
                        userDetails.getUsername()
                )
        );
    }


    @PatchMapping("/{id}/cancel")
    public BookingHistoryDTO cancelBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return bookingService.cancelBooking(
                id,
                userDetails.getUsername()
        );
    }


    @PostMapping
    public ResponseEntity<?> createBooking(
            @RequestBody BookingRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        try {
            BookingCreatedDTO result = bookingService.createBooking(
                    request,
                    userDetails.getUsername()
            );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", e.getMessage()));

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message",
                            "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."
                    ));
        }
    }


}