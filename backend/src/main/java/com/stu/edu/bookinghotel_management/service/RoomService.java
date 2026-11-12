
package com.stu.edu.bookinghotel_management.service;

import com.stu.edu.bookinghotel_management.dto.AvailableRoomDTO;
import com.stu.edu.bookinghotel_management.dto.RoomDTO;
import com.stu.edu.bookinghotel_management.entity.BookingStatus;
import com.stu.edu.bookinghotel_management.entity.Room;
import com.stu.edu.bookinghotel_management.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;

    @Transactional(readOnly = true)
    public List<AvailableRoomDTO> findAvailableRooms(
            LocalDate checkInDate,
            LocalDate checkOutDate,
            Integer guestCount
    ) {
        // 1. Kiểm tra dữ liệu đầu vào
        if (checkInDate == null || checkOutDate == null) {
            throw new IllegalArgumentException(
                    "Vui lòng chọn ngày nhận phòng và trả phòng."
            );
        }

        if (!checkInDate.isBefore(checkOutDate)) {
            throw new IllegalArgumentException(
                    "Ngày trả phòng phải sau ngày nhận phòng."
            );
        }

        if (guestCount == null || guestCount < 1) {
            throw new IllegalArgumentException(
                    "Số khách phải lớn hơn hoặc bằng 1."
            );
        }

        // 2. Xác định các trạng thái đang giữ lịch
        List<BookingStatus> blockingStatuses = List.of(
                BookingStatus.PENDING,
                BookingStatus.CONFIRMED,
                BookingStatus.CHECKED_IN
        );

        // 3. Tìm phòng trống theo ngày và số khách
        List<Room> rooms = roomRepository.findAvailableRooms(
                checkInDate,
                checkOutDate,
                guestCount,
                blockingStatuses
        );

        // 4. Chuyển Entity thành DTO để trả về Frontend
        return rooms.stream()
                .map(room -> new AvailableRoomDTO(
                        room.getId(),
                        room.getRoomNumber(),
                        room.getFloor(),
                        room.getRoomType().getId(),
                        room.getRoomType().getName(),
                        room.getRoomType().getDescription(),
                        room.getRoomType().getCapacity(),
                        room.getRoomType().getArea(),
                        room.getRoomType().getBedType(),
                        room.getRoomType().getBasePrice()
                ))
                .toList();
    }

    public List<RoomDTO> getAllRoom() {
        List<Room> rooms = roomRepository.findAll();

        if (rooms.isEmpty()) {
            throw new RuntimeException("Không có phòng nào trong hệ thống!");
        }

        return rooms.stream()
                .map(room -> new RoomDTO(
                        room.getId(),
                        room.getRoomNumber(),
                        room.getFloor(),
                        room.getStatus().name(),
                        room.getDescription(),
                        room.getRoomType().getId(),
                        room.getRoomType().getName(),
                        room.getRoomType().getDescription(),
                        room.getRoomType().getCapacity(),
                        room.getRoomType().getArea(),
                        room.getRoomType().getBedType(),
                        room.getRoomType().getBasePrice()
                ))
                .toList();
    }
}
