
package com.stu.edu.bookinghotel_management.dto.payment;

import com.stu.edu.bookinghotel_management.entity.PaymentMethod;
import com.stu.edu.bookinghotel_management.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponseDTO(
        Long id,
        Long bookingId,
        String bookingCode,
        String paymentReference,
        BigDecimal amount,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        String paymentUrl,
        String providerTransactionNo,
        LocalDateTime createdAt,
        LocalDateTime paidAt
) {
}
