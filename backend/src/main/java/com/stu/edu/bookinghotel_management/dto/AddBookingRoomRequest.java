package com.stu.edu.bookinghotel_management.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class AddBookingRoomRequest {

    private Long roomId;

    private LocalDate checkInDate;

    private LocalDate checkOutDate;

    private Integer guestCount;

    private String discountCode;

}