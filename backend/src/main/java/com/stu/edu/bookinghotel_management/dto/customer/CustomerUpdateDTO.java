
package com.stu.edu.bookinghotel_management.dto.customer;

import lombok.Data;

@Data
public class CustomerUpdateDTO {

    private String fullName;

    private String email;

    private String phone;

    private String address;

    private String idCard;
}
