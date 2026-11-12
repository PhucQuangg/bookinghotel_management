package com.stu.edu.bookinghotel_management.Controller;

import com.stu.edu.bookinghotel_management.config.JwtUtil;
import com.stu.edu.bookinghotel_management.dto.AuthRequestDTO;
import com.stu.edu.bookinghotel_management.dto.RegisterCustomerDTO;
import com.stu.edu.bookinghotel_management.entity.User;
import com.stu.edu.bookinghotel_management.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Map;

@Controller
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private UserService userService;

    @PostMapping("/login")
    @ResponseBody
    public Object login(@RequestBody AuthRequestDTO req) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword())
            );
        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(401).body("Sai tên đăng nhập hoặc mật khẩu!");
        }

        User user = userService.findByUsername(req.getUsername())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản!"));

        String role = user.getRole().name();
        String token = jwtUtil.generateToken(user.getUsername(), role);
        String username = user.getUsername();
        return Map.of(
                "token", token,
                "role", role,
                "username",username
        );
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterCustomerDTO dto) {
        try {
            userService.register(dto);
            return ResponseEntity.ok("Đăng ký tài khoản thành công! ");

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
