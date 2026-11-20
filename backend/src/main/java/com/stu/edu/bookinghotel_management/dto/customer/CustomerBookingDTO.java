
package com.stu.edu.bookinghotel_management.dto.customer;

import com.stu.edu.bookinghotel_management.entity.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerBookingDTO {

    private Long id;

    private String bookingCode;

    private LocalDate checkInDate;

    private LocalDate checkOutDate;

    private Integer guestCount;

    private BigDecimal totalAmount;

    private BigDecimal discountAmount;

    private BigDecimal finalAmount;

    private BookingStatus status;

    private LocalDateTime createdAt;
}
