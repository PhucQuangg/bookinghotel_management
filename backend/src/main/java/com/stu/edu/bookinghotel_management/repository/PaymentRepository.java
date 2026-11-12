package com.stu.edu.bookinghotel_management.repository;

import com.stu.edu.bookinghotel_management.entity.Payment;
import com.stu.edu.bookinghotel_management.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentReference(String paymentReference);

    Optional<Payment> findByBooking_Id(Long bookingId);

    // Lấy toàn bộ giao dịch của khách hàng đang đăng nhập
    List<Payment> findAllByCustomer_User_UsernameOrderByCreatedAtDesc(
            String username
    );

    // Lấy một giao dịch cụ thể, đồng thời kiểm tra quyền sở hữu
    Optional<Payment> findByIdAndCustomer_User_Username(
            Long id,
            String username
    );

    @Query("""
    SELECT COALESCE(SUM(p.amount), 0)
    FROM Payment p
    WHERE p.booking.id = :bookingId
      AND p.paymentStatus = :status
""")
    BigDecimal sumPaidAmountByBookingId(
            @Param("bookingId") Long bookingId,
            @Param("status") PaymentStatus status
    );

    List<Payment> findAllByBooking_IdOrderByCreatedAtDesc(Long bookingId);
}