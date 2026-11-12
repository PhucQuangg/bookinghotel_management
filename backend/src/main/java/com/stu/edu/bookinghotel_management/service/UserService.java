package com.stu.edu.bookinghotel_management.service;

import com.stu.edu.bookinghotel_management.dto.RegisterCustomerDTO;
import com.stu.edu.bookinghotel_management.entity.Customer;
import com.stu.edu.bookinghotel_management.entity.Role;
import com.stu.edu.bookinghotel_management.entity.User;
import com.stu.edu.bookinghotel_management.entity.UserStatus;
import com.stu.edu.bookinghotel_management.repository.CustomerRepository;
import com.stu.edu.bookinghotel_management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsernameIgnoreCase(username);
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
