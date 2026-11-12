package com.stu.edu.bookinghotel_management.controller;

import com.stu.edu.bookinghotel_management.dto.AddBookingRoomRequest;
import com.stu.edu.bookinghotel_management.dto.BookingHistoryDTO;
import com.stu.edu.bookinghotel_management.dto.BookingDetailDTO;
import com.stu.edu.bookinghotel_management.dto.payment.CreatePaymentRequest;
import com.stu.edu.bookinghotel_management.dto.payment.PaymentHistoryDTO;
import com.stu.edu.bookinghotel_management.entity.Booking;
import com.stu.edu.bookinghotel_management.entity.Payment;
import com.stu.edu.bookinghotel_management.service.BookingService;

import com.stu.edu.bookinghotel_management.service.PaymentService;
import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/bookings")
@RequiredArgsConstructor
public class AdminBookingController {

    private final BookingService bookingService;
    private final PaymentService paymentService;

    @GetMapping
    public ResponseEntity<List<BookingHistoryDTO>> getAllBookings(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate checkInDate
    ) {
        return ResponseEntity.ok(
                bookingService.searchAdminBookings(
                        keyword,
                        status,
                        checkInDate
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingDetailDTO> getBookingDetail(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                bookingService.getAdminBookingDetail(id)
        );
    }
    /**
     * Admin thêm phòng vào Booking hiện có.
     */
    @PostMapping("/{id}/rooms")
    public ResponseEntity<BookingDetailDTO> addRoomToBooking(
            @PathVariable Long id,
            @RequestBody AddBookingRoomRequest request
    ) {
        return ResponseEntity.ok(
                bookingService.addRoomToBooking(id, request)
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Booking> updateBookingStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        return ResponseEntity.ok(
                bookingService.updateBookingStatus(id, status)
        );
    }

    /**
     * Lấy lịch sử thanh toán của booking.
     */
    @GetMapping("/{id}/payments")
    public ResponseEntity<List<PaymentHistoryDTO>> getBookingPayments(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                paymentService.getPaymentsByBooking(id)
        );
    }

    /**
     * Admin thêm giao dịch thanh toán tiền mặt.
     */
    @PostMapping("/{id}/payments")
    public ResponseEntity<?> createPayment(
            @PathVariable Long id,
            @RequestBody CreatePaymentRequest request
    ) {
        return ResponseEntity.ok(
                paymentService.createPayment(id, request)
        );
    }

    @PutMapping("/{bookingId}/payments/{paymentId}")
    public ResponseEntity<?> updatePayment(
            @PathVariable Long bookingId,
            @PathVariable Long paymentId,
            @RequestBody Payment request
    ) {
        return ResponseEntity.ok(
                paymentService.updatePayment(bookingId, paymentId, request)
        );
    }

    /**
     * Admin cập nhật phòng trong Booking.
     */
    @PutMapping("/{bookingId}/rooms/{bookingRoomId}")
    public ResponseEntity<BookingDetailDTO> updateRoomInBooking(
            @PathVariable Long bookingId,
            @PathVariable Long bookingRoomId,
            @RequestBody AddBookingRoomRequest request
    ) {
        return ResponseEntity.ok(
                bookingService.updateRoomInBooking(
                        bookingId,
                        bookingRoomId,
                        request
                )
        );
    }

    /**
     * Admin xóa phòng khỏi Booking.
     */
    @DeleteMapping("/{bookingId}/rooms/{bookingRoomId}")
    public ResponseEntity<BookingDetailDTO> deleteRoomFromBooking(
            @PathVariable Long bookingId,
            @PathVariable Long bookingRoomId
    ) {
        return ResponseEntity.ok(
                bookingService.deleteRoomFromBooking(
                        bookingId,
                        bookingRoomId
                )
        );
    }

    @PutMapping("/{id}/note")
    public ResponseEntity<BookingDetailDTO> updateBookingNote(
            @PathVariable Long id,
            @RequestBody(required = false) String note
    ) {
        return ResponseEntity.ok(
                bookingService.updateBookingNote(id, note)
        );
    }
}