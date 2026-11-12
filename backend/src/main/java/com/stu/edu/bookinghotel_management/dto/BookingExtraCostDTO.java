package com.stu.edu.bookinghotel_management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingExtraCostDTO {

    private Long id;

    private Long bookingId;

    private String name;

    private String description;

    private Integer quantity;

    private BigDecimal unitPrice;

    private BigDecimal totalAmount;

    private LocalDate incurredDate;

    private String note;
}