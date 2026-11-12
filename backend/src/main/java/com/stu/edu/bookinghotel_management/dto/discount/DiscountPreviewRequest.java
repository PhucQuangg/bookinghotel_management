package com.stu.edu.bookinghotel_management.dto.discount;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class DiscountPreviewRequest {

    private Long roomId;

    private LocalDate checkInDate;

    private LocalDate checkOutDate;

    private String discountCode;
}