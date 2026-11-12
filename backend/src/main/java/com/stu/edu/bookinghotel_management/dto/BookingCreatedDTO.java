package com.stu.edu.bookinghotel_management.dto;

import com.stu.edu.bookinghotel_management.entity.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingCreatedDTO {

    private Long id;

    private String bookingCode;

    private String roomNumber;

    private String roomTypeName;

    private LocalDate checkInDate;

    private LocalDate checkOutDate;

    private Integer guestCount;

    private Long totalNights;

    // Tổng tiền phòng trước khi giảm giá
    private BigDecimal totalAmount;

    // Mã giảm giá đã áp dụng
    private String discountCode;

    // Số tiền được giảm
    private BigDecimal discountAmount;

    // Tổng tiền sau khi giảm giá
    private BigDecimal finalAmount;

    private BookingStatus status;
}
