package com.stu.edu.bookinghotel_management.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@Getter
@Setter
@AllArgsConstructor
public class CustomerProfileDTO {
    private String fullName;
    private String email;
    private String phone;
    private String idCard;
    private String address;
}
