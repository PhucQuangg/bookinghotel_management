package com.stu.edu.bookinghotel_management.service;

import com.stu.edu.bookinghotel_management.config.JwtUtil;
import com.stu.edu.bookinghotel_management.dto.AuthRequestDTO;
import com.stu.edu.bookinghotel_management.dto.RegisterCustomerDTO;
import com.stu.edu.bookinghotel_management.entity.Customer;
import com.stu.edu.bookinghotel_management.entity.Role;
import com.stu.edu.bookinghotel_management.entity.User;
import com.stu.edu.bookinghotel_management.entity.UserStatus;
import com.stu.edu.bookinghotel_management.repository.CustomerRepository;
import com.stu.edu.bookinghotel_management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private JwtUtil jwtUtil;

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsernameIgnoreCase(username);
    }
    // =========================
// ĐĂNG NHẬP
// =========================
    @Transactional(readOnly = true)
    public Map<String, String> login(AuthRequestDTO req) {

        // Kiểm tra thông tin đầu vào
        if (req.getUsername() == null || req.getUsername().isBlank()
                || req.getPassword() == null || req.getPassword().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng nhập tên đăng nhập và mật khẩu!"
            );
        }

        // Tìm tài khoản
        User user = findByUsername(req.getUsername().trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Sai tên đăng nhập hoặc mật khẩu!"
                ));

        // Kiểm tra tài khoản bị khóa
        if (user.getUserStatus() == UserStatus.LOCKED) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ khách sạn để được hỗ trợ."
            );
        }

        // Xác thực username và password
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            req.getUsername().trim(),
                            req.getPassword()
                    )
            );
        } catch (BadCredentialsException ex) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Sai tên đăng nhập hoặc mật khẩu!"
            );
        }

        // Tạo JWT
        String role = user.getRole().name();

        String token = jwtUtil.generateToken(
                user.getUsername(),
                role
        );

        return Map.of(
                "token", token,
                "role", role,
                "username", user.getUsername()
        );
    }

    public Customer register(RegisterCustomerDTO dto) {

        // 1. Kiểm tra username
        if (userRepository.findByUsernameIgnoreCase(dto.getUsername()).isPresent()) {
            throw new RuntimeException("Tên đăng nhập đã tồn tại!");
        }

        // 2. Kiểm tra email
        if (customerRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã được sử dụng!");
        }

        // 3. Tạo User
        User user = new User();

        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRole(Role.CUSTOMER);
        user.setUserStatus(UserStatus.ACTIVE);

        user = userRepository.save(user);

        Customer customer = new Customer();

        customer.setUser(user);
        customer.setFullName(dto.getFullName());
        customer.setEmail(dto.getEmail());
        customer.setPhone(dto.getPhone());

        return customerRepository.save(customer);
    }
}
