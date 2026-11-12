package com.stu.edu.bookinghotel_management.controller;

import com.stu.edu.bookinghotel_management.dto.payment.PaymentHistoryDTO;
import com.stu.edu.bookinghotel_management.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Tạo giao dịch thanh toán VNPay.
     */
    @PostMapping("/checkout")
    public ResponseEntity<?> createCheckout(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpRequest
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "success", false,
                            "message", "Vui lòng đăng nhập để thực hiện thanh toán."
                    ));
        }

        try {
            Map<String, Object> result = paymentService.createCheckout(
                    request,
                    userDetails.getUsername(),
                    httpRequest.getRemoteAddr()
            );

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", e.getMessage()
                    )
            );

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "message", "Không thể tạo giao dịch thanh toán."
                    ));
        }
    }

    /**
     * VNPay gọi IPN để xác nhận kết quả giao dịch.
     */
    @GetMapping("/vnpay/ipn")
    public ResponseEntity<Map<String, String>> vnpayIpn(
            @RequestParam Map<String, String> params
    ) {
        Map<String, String> result =
                paymentService.processVnpayIpn(params);

        return ResponseEntity.ok(result);
    }

    /**
     * VNPay chuyển người dùng về sau khi thanh toán.
     */
    @GetMapping("/vnpay/return")
    public ResponseEntity<Map<String, Object>> vnpayReturn(
            @RequestParam Map<String, String> params
    ) {
        try {
            Map<String, Object> result =
                    paymentService.processVnpayReturn(params);

            if (Boolean.TRUE.equals(result.get("pending"))) {
                return ResponseEntity.status(HttpStatus.ACCEPTED)
                        .body(result);
            }

            if (Boolean.TRUE.equals(result.get("success"))) {
                return ResponseEntity.ok(result);
            }

            return ResponseEntity.badRequest().body(result);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "pending", false,
                            "message", "Không thể xử lý kết quả thanh toán."
                    ));
        }
    }

    /**
     * Lấy lịch sử thanh toán của khách hàng đang đăng nhập.
     */
    @GetMapping("/history")
    public ResponseEntity<?> getPaymentHistory(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "success", false,
                            "message", "Vui lòng đăng nhập."
                    ));
        }

        try {
            List<PaymentHistoryDTO> result =
                    paymentService.getPaymentHistory(
                            userDetails.getUsername()
                    );

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "message", "Không thể lấy lịch sử thanh toán."
                    ));
        }
    }

    /**
     * Xem chi tiết một giao dịch thanh toán.
     */
    @GetMapping("/history/{id}")
    public ResponseEntity<?> getPaymentHistoryDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "success", false,
                            "message", "Vui lòng đăng nhập."
                    ));
        }

        try {
            PaymentHistoryDTO result =
                    paymentService.getPaymentHistoryDetail(
                            id,
                            userDetails.getUsername()
                    );

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "message", "Không thể lấy chi tiết thanh toán."
                    ));
        }
    }
}