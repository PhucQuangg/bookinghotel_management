
package com.stu.edu.bookinghotel_management.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class BookingRequestDTO {

    private Long roomId;

    private LocalDate checkInDate;

    private LocalDate checkOutDate;

    private Integer guestCount;

    private String note;

    private String discountCode;
}
