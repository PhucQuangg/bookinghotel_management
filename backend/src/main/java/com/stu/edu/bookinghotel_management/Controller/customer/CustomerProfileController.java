package com.stu.edu.bookinghotel_management.Controller.customer;

import com.stu.edu.bookinghotel_management.dto.CustomerProfileDTO;
import com.stu.edu.bookinghotel_management.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/api/customers")
public class CustomerProfileController {

    @Autowired
    private CustomerService customerService;
    @GetMapping("/me")
    public ResponseEntity<CustomerProfileDTO> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {

        CustomerProfileDTO profile =
                customerService.getMyProfile(userDetails.getUsername());

        return ResponseEntity.ok(profile);
    }
    @PutMapping("/me")
    public ResponseEntity<CustomerProfileDTO> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CustomerProfileDTO request) {

        CustomerProfileDTO updatedProfile =
                customerService.updateMyProfile(
                        userDetails.getUsername(),
                        request
                );

        return ResponseEntity.ok(updatedProfile);
    }
}
