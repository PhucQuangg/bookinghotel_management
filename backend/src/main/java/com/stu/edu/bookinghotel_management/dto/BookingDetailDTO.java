
package com.stu.edu.bookinghotel_management.dto;

import com.stu.edu.bookinghotel_management.entity.Booking;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Setter
@Getter
@AllArgsConstructor
public class BookingDetailDTO {

    // Thông tin booking
    private Long id;
    private String bookingCode;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Integer guestCount;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String status;
    private String note;
    private LocalDateTime createdAt;

    // Thông tin khách hàng
    private String customerName;
    private String customerEmail;
    private String customerPhone;

    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private String paymentStatus;

    // Danh sách phòng thuộc booking
    private List<RoomItemDTO> rooms;


    public BookingDetailDTO(
            Booking booking,
            List<RoomItemDTO> rooms,
            BigDecimal paidAmount,
            BigDecimal remainingAmount,
            String paymentStatus
    ) {
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

        this.note = booking.getNote();
        this.createdAt = booking.getCreatedAt();

        if (booking.getCustomer() != null) {
            this.customerName = booking.getCustomer().getFullName();
            this.customerEmail = booking.getCustomer().getEmail();
            this.customerPhone = booking.getCustomer().getPhone();
        }

        this.rooms = rooms;

        // Thông tin thanh toán
        this.paidAmount = paidAmount;
        this.remainingAmount = remainingAmount;
        this.paymentStatus = paymentStatus;
    }
    public BookingDetailDTO(
            Booking booking,
            List<RoomItemDTO> rooms
    ) {
        this.id = booking.getId();
        this.bookingCode = booking.getBookingCode();
        this.checkInDate = booking.getCheckInDate();
        this.checkOutDate = booking.getCheckOutDate();
        this.guestCount = booking.getGuestCount();
        this.totalAmount = booking.getTotalAmount();
        this.discountAmount = booking.getDiscountAmount();
        this.finalAmount = booking.getFinalAmount();
        this.status = booking.getStatus() != null
                ? booking.getStatus().name() : null;
        this.note = booking.getNote();
        this.createdAt = booking.getCreatedAt();

        if (booking.getCustomer() != null) {
            this.customerName = booking.getCustomer().getFullName();
            this.customerEmail = booking.getCustomer().getEmail();
            this.customerPhone = booking.getCustomer().getPhone();
        }

        this.rooms = rooms;
    }

}
