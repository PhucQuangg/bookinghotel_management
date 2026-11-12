
package com.stu.edu.bookinghotel_management.dto.payment;

import com.stu.edu.bookinghotel_management.entity.PaymentMethod;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class CreatePaymentRequest {

    @NotNull(message = "Vui lòng chọn phòng.")
    private Long roomId;

    @NotNull(message = "Vui lòng chọn ngày nhận phòng.")
    @FutureOrPresent(message = "Ngày nhận phòng không được ở trong quá khứ.")
    private LocalDate checkInDate;

    @NotNull(message = "Vui lòng chọn ngày trả phòng.")
    private LocalDate checkOutDate;

    @NotNull(message = "Vui lòng nhập số lượng khách.")
    @Positive(message = "Số lượng khách phải lớn hơn 0.")
    private Integer guestCount;

    private String note;

    @NotNull(message = "Vui lòng chọn phương thức thanh toán.")
    private PaymentMethod paymentMethod;

    // Dùng cho chức năng Admin thêm khoản thanh toán
    private BigDecimal amount;
}
