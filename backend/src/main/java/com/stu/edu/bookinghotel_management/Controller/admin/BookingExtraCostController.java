package com.stu.edu.bookinghotel_management.controller;

import com.stu.edu.bookinghotel_management.dto.BookingExtraCostDTO;
import com.stu.edu.bookinghotel_management.service.BookingExtraCostService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/bookings")
@RequiredArgsConstructor
public class BookingExtraCostController {

    private final BookingExtraCostService extraCostService;

    // Lấy danh sách chi phí phát sinh
    @GetMapping("/{bookingId}/extra-costs")
    public ResponseEntity<List<BookingExtraCostDTO>> getExtraCosts(
            @PathVariable Long bookingId
    ) {
        return ResponseEntity.ok(
                extraCostService.getByBookingId(bookingId)
        );
    }

    // Thêm chi phí phát sinh
    @PostMapping("/{bookingId}/extra-costs")
    public ResponseEntity<BookingExtraCostDTO> createExtraCost(
            @PathVariable Long bookingId,
            @RequestBody BookingExtraCostDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(extraCostService.create(bookingId, request));
    }

    // Cập nhật chi phí phát sinh
    @PutMapping("/{bookingId}/extra-costs/{id}")
    public ResponseEntity<BookingExtraCostDTO> updateExtraCost(
            @PathVariable Long bookingId,
            @PathVariable Long id,
            @RequestBody BookingExtraCostDTO request
    ) {
        return ResponseEntity.ok(
                extraCostService.update(bookingId, id, request)
        );
    }

    // Xóa chi phí phát sinh
    @DeleteMapping("/{bookingId}/extra-costs/{id}")
    public ResponseEntity<Void> deleteExtraCost(
            @PathVariable Long bookingId,
            @PathVariable Long id
    ) {
        extraCostService.delete(bookingId, id);
        return ResponseEntity.noContent().build();
    }
}