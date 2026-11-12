package com.stu.edu.bookinghotel_management.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@AllArgsConstructor
public class RoomDTO {
    private Long roomId;
    private String roomNumber;
    private Integer floor;
    private String roomStatus;
    private String roomDescription;

    // Thông tin loại phòng
    private Long roomTypeId;
    private String roomTypeName;
    private String roomTypeDescription;
    private Integer capacity;
    private BigDecimal area;
    private String bedType;
    private BigDecimal basePrice;
}
