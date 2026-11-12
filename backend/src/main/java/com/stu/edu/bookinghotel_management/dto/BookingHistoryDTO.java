package com.stu.edu.bookinghotel_management.dto;

import com.stu.edu.bookinghotel_management.entity.Booking;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class BookingHistoryDTO {

    private Long id;

    private String bookingCode;

    private LocalDate checkInDate;

    private LocalDate checkOutDate;

    private Integer guestCount;

    private BigDecimal totalAmount;

    private BigDecimal discountAmount;

    private BigDecimal finalAmount;

    private String status;

    private String createdByRole;

    private LocalDateTime createdAt;

    // Thông tin khách hàng dành cho danh sách Admin
    private String customerName;

    private String customerEmail;

    private String customerPhone;

    public BookingHistoryDTO(Booking booking) {

        this.id = booking.getId();

        this.bookingCode = booking.getBookingCode();

        this.checkInDate = booking.getCheckInDate();

        this.checkOutDate = booking.getCheckOutDate();

        this.guestCount = booking.getGuestCount();

        this.totalAmount = booking.getTotalAmount();

        this.discountAmount = booking.getDiscountAmount();

        this.finalAmount = booking.getFinalAmount();

        this.status = booking.getStatus() != null
                ? booking.getStatus().name()
                : null;

        this.createdByRole = booking.getCreatedByRole() != null
                ? booking.getCreatedByRole().name()
                : "CUSTOMER";

        this.createdAt = booking.getCreatedAt();

        if (booking.getCustomer() != null) {
            this.customerName = booking.getCustomer().getFullName();
            this.customerEmail = booking.getCustomer().getEmail();
            this.customerPhone = booking.getCustomer().getPhone();
        }
    }
}