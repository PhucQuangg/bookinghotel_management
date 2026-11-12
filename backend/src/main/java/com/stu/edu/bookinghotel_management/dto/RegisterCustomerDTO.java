package com.stu.edu.bookinghotel_management.dto;


import lombok.Data;

import java.time.LocalDate;

@Data
public class RegisterCustomerDTO {

    private String username;

    private String password;

    private String email;

    private String fullName;

    private String phone;
}
