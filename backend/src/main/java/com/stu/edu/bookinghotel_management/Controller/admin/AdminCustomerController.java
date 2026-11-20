
package com.stu.edu.bookinghotel_management.controller;

import com.stu.edu.bookinghotel_management.dto.customer.CustomerDTO;
import com.stu.edu.bookinghotel_management.dto.customer.CustomerBookingDTO;
import com.stu.edu.bookinghotel_management.dto.customer.CustomerUpdateDTO;
import com.stu.edu.bookinghotel_management.entity.UserStatus;
import com.stu.edu.bookinghotel_management.service.CustomerService;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/customers")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3001")
public class AdminCustomerController {

    private final CustomerService customerService;

    // Danh sách khách hàng
    @GetMapping
    public Page<CustomerDTO> getAllCustomers(
            @RequestParam(required = false) String keyword,
            @PageableDefault(
                    page = 0,
                    size = 10,
                    sort = "id",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        return customerService.getAllCustomers(keyword, pageable);
    }

    // Chi tiết khách hàng
    @GetMapping("/{id}")
    public CustomerDTO getCustomerDetail(
            @PathVariable Integer id
    ) {
        return customerService.getCustomerDetail(id);
    }

    // Lịch sử đặt phòng
    @GetMapping("/{id}/bookings")
    public List<CustomerBookingDTO> getCustomerBookings(
            @PathVariable Integer id
    ) {
        return customerService.getCustomerBookings(id);
    }

    // Cập nhật thông tin khách hàng
    @PutMapping("/{id}")
    public CustomerDTO updateCustomer(
            @PathVariable Integer id,
            @RequestBody CustomerUpdateDTO request
    ) {
        return customerService.updateCustomer(id, request);
    }

    // Khóa / mở khóa tài khoản
    @PatchMapping("/{id}/status")
    public CustomerDTO updateCustomerStatus(
            @PathVariable Integer id,
            @RequestParam UserStatus status
    ) {
        return customerService.updateCustomerStatus(id, status);
    }
}
