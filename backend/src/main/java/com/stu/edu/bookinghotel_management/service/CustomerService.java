package com.stu.edu.bookinghotel_management.service;

import com.stu.edu.bookinghotel_management.dto.CustomerProfileDTO;
import com.stu.edu.bookinghotel_management.dto.customer.CustomerBookingDTO;
import com.stu.edu.bookinghotel_management.dto.customer.CustomerDTO;
import com.stu.edu.bookinghotel_management.dto.customer.CustomerUpdateDTO;
import com.stu.edu.bookinghotel_management.entity.*;
import com.stu.edu.bookinghotel_management.repository.BookingRepository;
import com.stu.edu.bookinghotel_management.repository.CustomerRepository;
import com.stu.edu.bookinghotel_management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CustomerService {
    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private BookingRepository bookingRepository;


    @Autowired
    private UserRepository userRepository;


    @Transactional(readOnly = true)
    public CustomerProfileDTO getMyProfile(String username) {
        Customer customer = customerRepository
                .findByUser_Username(username)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy thông tin khách hàng"));

        return toDTO(customer);
    }

    @Transactional
    public CustomerProfileDTO updateMyProfile(
            String username,
            CustomerProfileDTO request) {

        Customer customer = customerRepository
                .findByUser_Username(username)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy thông tin khách hàng"));

        customer.setFullName(request.getFullName().trim());
        customer.setEmail(request.getEmail().trim());
        customer.setPhone(request.getPhone());
        customer.setIdCard(request.getIdCard());
        customer.setAddress(request.getAddress());

        Customer savedCustomer = customerRepository.save(customer);

        return toDTO(savedCustomer);
    }

    private CustomerProfileDTO toDTO(Customer customer) {
        return new CustomerProfileDTO(
                customer.getFullName(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getIdCard(),
                customer.getAddress()
        );
    }

    // =========================
    // DANH SÁCH KHÁCH HÀNG
    // =========================
    public Page<CustomerDTO> getAllCustomers(
            String keyword,
            Pageable pageable
    ) {
        String searchKeyword =
                (keyword == null || keyword.isBlank())
                        ? null
                        : keyword.trim();

        return customerRepository
                .searchCustomers(searchKeyword, pageable)
                .map(customer -> mapToCustomerDTO(customer, false));
    }

    // =========================
    // CHI TIẾT KHÁCH HÀNG
    // =========================
    public CustomerDTO getCustomerDetail(Integer customerId) {

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy khách hàng có ID: " + customerId
                ));

        return mapToCustomerDTO(customer, true);
    }

    // =========================
    // LỊCH SỬ ĐẶT PHÒNG
    // =========================
    public List<CustomerBookingDTO> getCustomerBookings(
            Integer customerId
    ) {

        if (!customerRepository.existsById(customerId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy khách hàng có ID: " + customerId
            );
        }

        return bookingRepository
                .findByCustomer_IdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(this::mapToCustomerBookingDTO)
                .toList();
    }

    // =========================
    // MAP CUSTOMER DTO
    // =========================
    private CustomerDTO mapToCustomerDTO(
            Customer customer,
            boolean includeIdCard
    ) {

        String username = null;
        Role role = null;
        UserStatus userStatus = null;

        if (customer.getUser() != null) {
            username = customer.getUser().getUsername();
            role = customer.getUser().getRole();
            userStatus = customer.getUser().getUserStatus();
        }

        Long totalBookings =
                bookingRepository.countByCustomer_Id(customer.getId());

        return new CustomerDTO(
                customer.getId(),
                customer.getFullName(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getAddress(),
                includeIdCard ? customer.getIdCard() : null,
                customer.getAvatar(),
                username,
                role,
                userStatus,
                totalBookings
        );
    }

    // =========================
    // MAP BOOKING DTO
    // =========================
    private CustomerBookingDTO mapToCustomerBookingDTO(
            Booking booking
    ) {
        return new CustomerBookingDTO(
                booking.getId(),
                booking.getBookingCode(),
                booking.getCheckInDate(),
                booking.getCheckOutDate(),
                booking.getGuestCount(),
                booking.getTotalAmount(),
                booking.getDiscountAmount(),
                booking.getFinalAmount(),
                booking.getStatus(),
                booking.getCreatedAt()
        );
    }


    // =========================
    // CẬP NHẬT THÔNG TIN KHÁCH HÀNG
    // =========================
    @Transactional
    public CustomerDTO updateCustomer(
            Integer customerId,
            CustomerUpdateDTO request
    ) {

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy khách hàng có ID: " + customerId
                ));

        if (request.getFullName() == null || request.getFullName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Họ tên không được để trống"
            );
        }

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email không được để trống"
            );
        }

        if (request.getPhone() == null || request.getPhone().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số điện thoại không được để trống"
            );
        }

        String email = request.getEmail().trim();

        // Kiểm tra email đã được khách hàng khác sử dụng chưa
        customerRepository.findByEmail(email).ifPresent(existingCustomer -> {
            if (!existingCustomer.getId().equals(customerId)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Email đã được sử dụng bởi khách hàng khác"
                );
            }
        });

        customer.setFullName(request.getFullName().trim());
        customer.setEmail(email);
        customer.setPhone(request.getPhone().trim());
        customer.setAddress(
                request.getAddress() == null
                        ? null
                        : request.getAddress().trim()
        );
        customer.setIdCard(
                request.getIdCard() == null
                        ? null
                        : request.getIdCard().trim()
        );

        Customer savedCustomer = customerRepository.save(customer);

        return mapToCustomerDTO(savedCustomer, true);
    }

    // =========================
    // KHÓA / MỞ KHÓA TÀI KHOẢN
    // =========================
    @Transactional
    public CustomerDTO updateCustomerStatus(
            Integer customerId,
            UserStatus status
    ) {

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy khách hàng có ID: " + customerId
                ));

        if (status == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trạng thái tài khoản không hợp lệ"
            );
        }

        User user = customer.getUser();

        if (user == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy tài khoản của khách hàng"
            );
        }

        if (user.getRole() != Role.CUSTOMER) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tài khoản này không phải tài khoản khách hàng"
            );
        }

        user.setUserStatus(status);
        userRepository.save(user);

        return mapToCustomerDTO(customer, true);
    }

}
