package com.stu.edu.bookinghotel_management.dto.payment;

import com.stu.edu.bookinghotel_management.entity.PaymentMethod;
import com.stu.edu.bookinghotel_management.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentHistoryDTO {

    private Long id;

    private String paymentReference;

    private String bookingCode;

    private BigDecimal amount;

    private BigDecimal totalAmount;

    private BigDecimal discountAmount;

    private BigDecimal finalAmount;

    private String discountCode;

    private PaymentMethod paymentMethod;

    private PaymentStatus paymentStatus;

    private String providerTransactionNo;

    private Long roomId;

    private LocalDate checkInDate;

    private LocalDate checkOutDate;

    private Integer guestCount;

    private LocalDateTime createdAt;

    private LocalDateTime paidAt;
}