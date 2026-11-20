
package com.stu.edu.bookinghotel_management.Controller;

import com.stu.edu.bookinghotel_management.dto.AuthRequestDTO;
import com.stu.edu.bookinghotel_management.dto.RegisterCustomerDTO;
import com.stu.edu.bookinghotel_management.service.UserService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    // =========================
    // ĐĂNG NHẬP
    // =========================
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(
            @RequestBody AuthRequestDTO req
    ) {
        return ResponseEntity.ok(userService.login(req));
    }

    // =========================
    // ĐĂNG KÝ
    // =========================
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody RegisterCustomerDTO dto
    ) {
        userService.register(dto);

        return ResponseEntity.ok(
                "Đăng ký tài khoản thành công!"
        );
    }
}
