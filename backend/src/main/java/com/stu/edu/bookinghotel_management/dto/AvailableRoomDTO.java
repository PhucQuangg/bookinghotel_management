package com.stu.edu.bookinghotel_management.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AvailableRoomDTO {

    private Long id;
    private String roomNumber;
    private Integer floor;

    private Long roomTypeId;
    private String roomTypeName;
    private String description;

    private Integer capacity;
    private BigDecimal area;
    private String bedType;
    private BigDecimal basePrice;
}

