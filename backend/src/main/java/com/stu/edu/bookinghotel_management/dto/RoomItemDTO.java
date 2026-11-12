
package com.stu.edu.bookinghotel_management.dto;

import com.stu.edu.bookinghotel_management.entity.BookingRoom;
import com.stu.edu.bookinghotel_management.entity.Room;
import com.stu.edu.bookinghotel_management.entity.RoomType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Setter
@Getter
@AllArgsConstructor
public class RoomItemDTO {

    // ID của bản ghi phòng thuộc Booking
    private Long bookingRoomId;

    // Thông tin phòng thực tế
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

    // Thông tin phòng tại thời điểm đặt
    private LocalDate checkInDate;
    private String discountCode;
    private BigDecimal discountAmount;
    private LocalDate checkOutDate;
    private BigDecimal roomPrice;
    private Integer guestCount;

    public RoomItemDTO(BookingRoom bookingRoom, Room room) {
        RoomType type = room.getRoomType();

        // Lấy ID của BookingRoom
        this.bookingRoomId = bookingRoom.getId();

        // Thông tin phòng thực tế
        this.roomId = room.getId();
        this.roomNumber = room.getRoomNumber();
        this.floor = room.getFloor();
        this.roomStatus = room.getStatus() != null
                ? room.getStatus().name() : null;
        this.roomDescription = room.getDescription();

        // Thông tin loại phòng
        this.roomTypeId = type.getId();
        this.roomTypeName = type.getName();
        this.roomTypeDescription = type.getDescription();
        this.capacity = type.getCapacity();
        this.area = type.getArea();
        this.bedType = type.getBedType();
        this.basePrice = type.getBasePrice();

        // Thông tin phòng tại thời điểm đặt
        this.checkInDate = bookingRoom.getCheckInDate();
        this.checkOutDate = bookingRoom.getCheckOutDate();
        this.roomPrice = bookingRoom.getRoomPrice();
        this.guestCount = bookingRoom.getGuestCount();
        this.discountCode = bookingRoom.getDiscountCode();

        this.discountAmount = bookingRoom.getDiscountAmount() != null
                ? bookingRoom.getDiscountAmount()
                : BigDecimal.ZERO;
    }
}
