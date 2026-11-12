package com.stu.edu.bookinghotel_management.service;

import com.stu.edu.bookinghotel_management.dto.CustomerProfileDTO;
import com.stu.edu.bookinghotel_management.entity.Customer;
import com.stu.edu.bookinghotel_management.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerService {
    @Autowired
    private CustomerRepository customerRepository;

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
}
