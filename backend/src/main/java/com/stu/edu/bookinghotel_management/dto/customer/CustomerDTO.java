
package com.stu.edu.bookinghotel_management.dto.customer;

import com.stu.edu.bookinghotel_management.entity.Role;
import com.stu.edu.bookinghotel_management.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDTO {

    private Integer id;

    private String fullName;

    private String email;

    private String phone;

    private String address;

    private String idCard;

    private String avatar;

    private String username;

    private Role role;

    private UserStatus userStatus;

    private Long totalBookings;
}
