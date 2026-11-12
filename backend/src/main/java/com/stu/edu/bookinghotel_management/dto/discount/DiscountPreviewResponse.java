package com.stu.edu.bookinghotel_management.dto.discount;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@AllArgsConstructor
public class DiscountPreviewResponse {

    private String code;

    private String discountType;

    private BigDecimal totalAmount;

    private BigDecimal discountAmount;

    private BigDecimal finalAmount;

    private String message;
}