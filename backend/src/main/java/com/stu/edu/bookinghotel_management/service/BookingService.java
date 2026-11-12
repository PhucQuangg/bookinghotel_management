
package com.stu.edu.bookinghotel_management.service;

import com.stu.edu.bookinghotel_management.dto.*;
import com.stu.edu.bookinghotel_management.entity.*;
import com.stu.edu.bookinghotel_management.repository.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingRoomRepository bookingRoomRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private DiscountService discountService;

    @Autowired
    private PaymentRepository paymentRepository;


    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private BookingExtraCostRepository extraCostRepository;

    @Transactional(readOnly = true)
    public List<BookingHistoryDTO> getMyBookings(String username) {
        return bookingRepository
                .findByCustomer_User_UsernameOrderByCreatedAtDesc(username)
                .stream()
                .map(BookingHistoryDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public BookingDetailDTO getBookingDetail(Long id, String username) {
        Booking booking = bookingRepository
                .findByIdAndCustomer_User_Username(id, username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy đặt phòng hoặc bạn không có quyền xem."
                ));

        List<RoomItemDTO> rooms = bookingRoomRepository
                .findByBookingId(booking.getId())
                .stream()
                .map(this::toRoomItemDTO)
                .toList();

        return new BookingDetailDTO(booking, rooms);
    }

    private RoomItemDTO toRoomItemDTO(BookingRoom bookingRoom) {
        Room room = roomRepository
                .findById(bookingRoom.getRoomId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy phòng có mã: "
                                + bookingRoom.getRoomId()
                ));

        return new RoomItemDTO(bookingRoom, room);
    }

    @Transactional
    public BookingHistoryDTO cancelBooking(Long bookingId, String username) {
        Booking booking = bookingRepository
                .findByIdAndCustomer_User_Username(bookingId, username)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy đặt phòng hoặc bạn không có quyền hủy."
                ));

        BookingStatus status = booking.getStatus();

        if (status == BookingStatus.CANCELED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Đặt phòng này đã được hủy trước đó."
            );
        }

        if (status == BookingStatus.COMPLETED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể hủy đặt phòng đã hoàn thành."
            );
        }

        if (status == BookingStatus.CHECKED_IN) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không thể hủy đặt phòng đang lưu trú."
            );
        }

        if (booking.getCheckInDate() == null
                || !booking.getCheckInDate().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Chỉ được hủy đặt phòng trước ngày nhận phòng."
            );
        }

        if (status != BookingStatus.PENDING
                && status != BookingStatus.CONFIRMED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Trạng thái đặt phòng hiện tại không cho phép hủy."
            );
        }

        booking.setStatus(BookingStatus.CANCELED);

        Booking savedBooking = bookingRepository.save(booking);

        return new BookingHistoryDTO(savedBooking);
    }

    @Transactional
    public BookingCreatedDTO createBooking(
            BookingRequestDTO request,
            String username
    ) {
        // 1. Kiểm tra dữ liệu đầu vào
        if (request.getRoomId() == null
                || request.getCheckInDate() == null
                || request.getCheckOutDate() == null
                || request.getGuestCount() == null) {
            throw new IllegalArgumentException(
                    "Vui lòng nhập đầy đủ thông tin đặt phòng."
            );
        }

        LocalDate checkIn = request.getCheckInDate();
        LocalDate checkOut = request.getCheckOutDate();
        Integer guestCount = request.getGuestCount();

        if (checkIn.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "Ngày nhận phòng không được ở trong quá khứ."
            );
        }

        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException(
                    "Ngày trả phòng phải sau ngày nhận phòng."
            );
        }

        if (guestCount < 1) {
            throw new IllegalArgumentException(
                    "Số lượng khách phải lớn hơn 0."
            );
        }

        // 2. Lấy thông tin khách hàng
        Customer customer = customerRepository
                .findByUser_Username(username)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy thông tin khách hàng."
                ));

        // 3. Kiểm tra phòng tồn tại
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Phòng không tồn tại."
                ));

        // 4. Kiểm tra sức chứa
        if (room.getRoomType() == null
                || room.getRoomType().getCapacity() == null
                || guestCount > room.getRoomType().getCapacity()) {
            throw new IllegalArgumentException(
                    "Số khách vượt quá sức chứa của phòng."
            );
        }

        // 5. Kiểm tra lịch phòng
        List<BookingStatus> blockingStatuses = List.of(
                BookingStatus.PENDING,
                BookingStatus.CONFIRMED,
                BookingStatus.CHECKED_IN
        );

        List<Room> availableRooms = roomRepository.findAvailableRooms(
                checkIn,
                checkOut,
                guestCount,
                blockingStatuses
        );

        boolean isAvailable = availableRooms.stream()
                .anyMatch(availableRoom ->
                        availableRoom.getId().equals(room.getId())
                );

        if (!isAvailable) {
            throw new IllegalArgumentException(
                    "Phòng không còn trống trong khoảng thời gian đã chọn."
            );
        }

        // 6. Tính tiền phòng
        BigDecimal roomPrice = room.getRoomType().getBasePrice();

        if (roomPrice == null
                || roomPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Giá phòng không hợp lệ."
            );
        }

        long totalNights = ChronoUnit.DAYS.between(
                checkIn,
                checkOut
        );

        BigDecimal totalAmount = roomPrice
                .multiply(BigDecimal.valueOf(totalNights))
                .setScale(0, RoundingMode.HALF_UP);

        // 7. Chuẩn hóa mã giảm giá
        String discountCode = discountService.normalizeCode(
                request.getDiscountCode()
        );

        // 8. Tính giảm giá riêng cho phòng này
        BigDecimal discountAmount = BigDecimal.ZERO;

        if (discountCode != null && !discountCode.isBlank()) {
            discountAmount = discountService.calculateDiscount(
                    totalAmount,
                    discountCode
            );

            if (discountAmount == null
                    || discountAmount.compareTo(BigDecimal.ZERO) < 0) {
                discountAmount = BigDecimal.ZERO;
            }

            if (discountAmount.compareTo(totalAmount) > 0) {
                discountAmount = totalAmount;
            }
        }

        BigDecimal finalAmount = totalAmount
                .subtract(discountAmount)
                .max(BigDecimal.ZERO);

        // 9. Tạo Booking
        Booking booking = new Booking();

        booking.setBookingCode(
                "GS" + UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 12)
                        .toUpperCase()
        );

        booking.setCustomer(customer);
        booking.setCheckInDate(checkIn);
        booking.setCheckOutDate(checkOut);
        booking.setGuestCount(guestCount);

        booking.setTotalAmount(totalAmount);
        booking.setDiscountAmount(discountAmount);
        booking.setFinalAmount(finalAmount);

        booking.setStatus(BookingStatus.PENDING);
        booking.setCreatedByRole(Role.CUSTOMER);
        booking.setNote(request.getNote());

        // Giữ các trường này để tương thích với phần Booking hiện tại.
        // Khi Booking có nhiều phòng, không dùng chúng để tính giảm giá.
        booking.setDiscountCode(discountCode);

        Booking savedBooking = bookingRepository.save(booking);

        // 10. Lưu BookingRoom và thông tin giảm giá riêng
        BookingRoom bookingRoom = new BookingRoom();

        bookingRoom.setBookingId(savedBooking.getId());
        bookingRoom.setRoomId(room.getId());
        bookingRoom.setRoomPrice(roomPrice);
        bookingRoom.setGuestCount(guestCount);
        bookingRoom.setCheckInDate(checkIn);
        bookingRoom.setCheckOutDate(checkOut);

        bookingRoom.setDiscountCode(discountCode);
        bookingRoom.setDiscountAmount(discountAmount);

        bookingRoomRepository.save(bookingRoom);

        // 11. Tạo DTO trả về
        BookingCreatedDTO result = new BookingCreatedDTO(
                savedBooking.getId(),
                savedBooking.getBookingCode(),
                room.getRoomNumber(),
                room.getRoomType().getName(),
                checkIn,
                checkOut,
                guestCount,
                totalNights,
                totalAmount,
                discountCode,
                discountAmount,
                finalAmount,
                savedBooking.getStatus()
        );

        // 12. Gửi email xác nhận
        emailService.sendConfirmBookingEmails(
                customer.getEmail(),
                customer.getFullName(),
                result
        );

        return result;
    }

    /**
     * Gửi email xác nhận cho booking đã được tạo
     * sau khi thanh toán VNPay thành công.
     */
    @Transactional(readOnly = true)
    public void sendBookingConfirmationEmail(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy thông tin đặt phòng."
                ));

        Customer customer = booking.getCustomer();

        if (customer == null
                || customer.getEmail() == null
                || customer.getEmail().isBlank()) {
            throw new IllegalArgumentException(
                    "Khách hàng chưa có địa chỉ email."
            );
        }

        List<BookingRoom> bookingRooms =
                bookingRoomRepository.findByBookingId(bookingId);

        if (bookingRooms.isEmpty()) {
            throw new IllegalArgumentException(
                    "Đặt phòng chưa có thông tin phòng."
            );
        }

        BookingRoom bookingRoom = bookingRooms.get(0);

        Room room = roomRepository.findById(bookingRoom.getRoomId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy phòng."
                ));

        if (room.getRoomType() == null) {
            throw new IllegalArgumentException(
                    "Không tìm thấy loại phòng."
            );
        }

        long nights = ChronoUnit.DAYS.between(
                booking.getCheckInDate(),
                booking.getCheckOutDate()
        );

        BookingCreatedDTO bookingDTO = new BookingCreatedDTO(
                booking.getId(),
                booking.getBookingCode(),
                room.getRoomNumber(),
                room.getRoomType().getName(),
                booking.getCheckInDate(),
                booking.getCheckOutDate(),
                booking.getGuestCount(),
                nights,
                booking.getTotalAmount(),
                booking.getDiscountCode(),
                booking.getDiscountAmount(),
                booking.getFinalAmount(),
                booking.getStatus()
        );

        emailService.sendConfirmBookingEmails(
                customer.getEmail(),
                customer.getFullName(),
                bookingDTO
        );
    }

    // ================= ADMIN BOOKING =================

    /**
     * Lấy danh sách tất cả booking dành cho Admin
     */
    @Transactional(readOnly = true)
    public List<BookingHistoryDTO> getAllBookings() {

        return bookingRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(BookingHistoryDTO::new)
                .toList();
    }

    /**
     * Xem chi tiết booking dành cho Admin
     */
    @Transactional(readOnly = true)
    public BookingDetailDTO getAdminBookingDetail(Long id) {

        // 1. Lấy thông tin booking
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy thông tin đặt phòng."
                ));

        // 2. Lấy danh sách phòng
        List<RoomItemDTO> rooms = bookingRoomRepository
                .findByBookingId(booking.getId())
                .stream()
                .map(this::toRoomItemDTO)
                .toList();

        // 3. Tính tổng tiền đã thanh toán thành công
        BigDecimal paidAmount = paymentRepository.sumPaidAmountByBookingId(
                booking.getId(),
                PaymentStatus.PAID
        );

        if (paidAmount == null) {
            paidAmount = BigDecimal.ZERO;
        }

        // 4. Lấy tổng tiền booking
        BigDecimal finalAmount = booking.getFinalAmount() != null
                ? booking.getFinalAmount()
                : BigDecimal.ZERO;

        // 5. Tính số tiền còn lại
        BigDecimal remainingAmount = finalAmount.subtract(paidAmount);

        if (remainingAmount.compareTo(BigDecimal.ZERO) < 0) {
            remainingAmount = BigDecimal.ZERO;
        }

        // 6. Xác định trạng thái thanh toán tổng hợp
        String paymentStatus;

        if (paidAmount.compareTo(BigDecimal.ZERO) <= 0) {
            paymentStatus = "UNPAID";
        } else if (paidAmount.compareTo(finalAmount) >= 0) {
            paymentStatus = "PAID";
        } else {
            paymentStatus = "PARTIALLY_PAID";
        }

        // 7. Trả về DTO
        return new BookingDetailDTO(
                booking,
                rooms,
                paidAmount,
                remainingAmount,
                paymentStatus
        );
    }

    /**
     * Cập nhật trạng thái booking dành cho Admin
     */
    @Transactional
    public Booking updateBookingStatus(Long id, String newStatus) {

        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking"));

        if (newStatus == null || newStatus.trim().isEmpty()) {
            throw new RuntimeException("Trạng thái không được để trống");
        }

        try {
            BookingStatus status = BookingStatus.valueOf(
                    newStatus.trim().toUpperCase()
            );

            // Admin được chuyển sang bất kỳ trạng thái hợp lệ nào
            booking.setStatus(status);

        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái không hợp lệ: " + newStatus);
        }

        return bookingRepository.save(booking);
    }


    /**
     * Tìm kiếm và lọc booking dành cho Admin
     */
    public List<BookingHistoryDTO> searchAdminBookings(
            String keyword,
            String status,
            LocalDate checkInDate
    ) {
        String normalizedKeyword = keyword == null
                ? null
                : keyword.trim().toLowerCase();

        if (normalizedKeyword != null && normalizedKeyword.isEmpty()) {
            normalizedKeyword = null;
        }

        BookingStatus bookingStatus = null;

        if (status != null && !status.trim().isEmpty()) {
            try {
                bookingStatus = BookingStatus.valueOf(
                        status.trim().toUpperCase()
                );
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Trạng thái booking không hợp lệ.");
            }
        }

        List<Booking> bookings = bookingRepository.searchAdminBookings(
                normalizedKeyword,
                bookingStatus,
                checkInDate
        );

        return bookings.stream()
                .map(BookingHistoryDTO::new)
                .toList();
    }

    @Transactional
    public BookingDetailDTO addRoomToBooking(
            Long bookingId,
            AddBookingRoomRequest request
    ) {
        // 1. Kiểm tra request
        if (request == null
                || request.getRoomId() == null
                || request.getCheckInDate() == null
                || request.getCheckOutDate() == null
                || request.getGuestCount() == null) {
            throw new IllegalArgumentException(
                    "Vui lòng nhập đầy đủ thông tin phòng."
            );
        }

        LocalDate checkIn = request.getCheckInDate();
        LocalDate checkOut = request.getCheckOutDate();
        Integer guestCount = request.getGuestCount();

        if (checkIn.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "Ngày nhận phòng không được ở trong quá khứ."
            );
        }

        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException(
                    "Ngày trả phòng phải sau ngày nhận phòng."
            );
        }

        if (guestCount < 1) {
            throw new IllegalArgumentException(
                    "Số lượng khách phải lớn hơn 0."
            );
        }

        // 2. Tìm Booking
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy thông tin đặt phòng."
                ));

        if (booking.getStatus() != BookingStatus.PENDING
                && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException(
                    "Chỉ được thêm phòng vào Booking đang chờ xác nhận "
                            + "hoặc đã xác nhận."
            );
        }

        // 3. Tìm phòng
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy phòng."
                ));

        if (room.getStatus() != RoomStatus.VACANT) {
            throw new IllegalArgumentException(
                    "Phòng hiện không sẵn sàng để đặt."
            );
        }

        if (room.getRoomType() == null
                || room.getRoomType().getBasePrice() == null) {
            throw new IllegalArgumentException(
                    "Phòng chưa được cấu hình giá."
            );
        }

        // 4. Kiểm tra sức chứa
        Integer capacity = room.getRoomType().getCapacity();

        if (capacity == null || guestCount > capacity) {
            throw new IllegalArgumentException(
                    "Số lượng khách vượt quá sức chứa của phòng."
            );
        }

        // 5. Kiểm tra phòng đã tồn tại trong Booking chưa
        List<BookingRoom> existingRooms =
                bookingRoomRepository.findByBookingId(bookingId);

        boolean alreadyAdded = existingRooms.stream()
                .anyMatch(item ->
                        Objects.equals(item.getRoomId(), room.getId())
                                && datesOverlap(
                                item.getCheckInDate() != null
                                        ? item.getCheckInDate()
                                        : booking.getCheckInDate(),
                                item.getCheckOutDate() != null
                                        ? item.getCheckOutDate()
                                        : booking.getCheckOutDate(),
                                checkIn,
                                checkOut
                        )
                );

        if (alreadyAdded) {
            throw new IllegalArgumentException(
                    "Phòng này đã được thêm vào Booking "
                            + "trong khoảng thời gian bị trùng."
            );
        }

        // 6. Kiểm tra lịch phòng với các Booking khác
        List<BookingStatus> blockingStatuses = List.of(
                BookingStatus.PENDING,
                BookingStatus.CONFIRMED,
                BookingStatus.CHECKED_IN
        );

        List<Room> availableRooms =
                roomRepository.findAvailableRoomsForAdmin(
                        checkIn,
                        checkOut,
                        guestCount,
                        blockingStatuses,
                        bookingId
                );

        boolean available = availableRooms.stream()
                .anyMatch(item ->
                        Objects.equals(item.getId(), room.getId())
                );

        if (!available) {
            throw new IllegalArgumentException(
                    "Phòng không còn trống trong khoảng thời gian đã chọn."
            );
        }

        // 7. Tính tiền phòng mới
        long nights = ChronoUnit.DAYS.between(
                checkIn,
                checkOut
        );

        BigDecimal roomPrice = room.getRoomType().getBasePrice();

        if (roomPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Giá phòng không hợp lệ."
            );
        }

        BigDecimal roomTotal = roomPrice
                .multiply(BigDecimal.valueOf(nights))
                .setScale(0, RoundingMode.HALF_UP);

        // 8. Chuẩn hóa mã giảm giá của riêng phòng mới
        String discountCode = discountService.normalizeCode(
                request.getDiscountCode()
        );

        // 9. Tính giảm giá riêng cho phòng mới
        BigDecimal roomDiscount = BigDecimal.ZERO;

        if (discountCode != null && !discountCode.isBlank()) {
            roomDiscount = discountService.calculateDiscount(
                    roomTotal,
                    discountCode
            );

            if (roomDiscount == null
                    || roomDiscount.compareTo(BigDecimal.ZERO) < 0) {
                roomDiscount = BigDecimal.ZERO;
            }

            if (roomDiscount.compareTo(roomTotal) > 0) {
                roomDiscount = roomTotal;
            }
        }

        // 10. Lưu BookingRoom mới
        BookingRoom bookingRoom = new BookingRoom();

        bookingRoom.setBookingId(bookingId);
        bookingRoom.setRoomId(room.getId());
        bookingRoom.setRoomPrice(roomPrice);
        bookingRoom.setGuestCount(guestCount);
        bookingRoom.setCheckInDate(checkIn);
        bookingRoom.setCheckOutDate(checkOut);

        bookingRoom.setDiscountCode(discountCode);
        bookingRoom.setDiscountAmount(roomDiscount);

        bookingRoomRepository.save(bookingRoom);

        // 11. Tính lại tổng tiền của toàn Booking
        List<BookingRoom> updatedRooms =
                bookingRoomRepository.findByBookingId(bookingId);

        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalDiscountAmount = BigDecimal.ZERO;

        for (BookingRoom item : updatedRooms) {

            LocalDate itemCheckIn = item.getCheckInDate() != null
                    ? item.getCheckInDate()
                    : booking.getCheckInDate();

            LocalDate itemCheckOut = item.getCheckOutDate() != null
                    ? item.getCheckOutDate()
                    : booking.getCheckOutDate();

            if (itemCheckIn == null
                    || itemCheckOut == null
                    || !itemCheckOut.isAfter(itemCheckIn)) {
                throw new IllegalArgumentException(
                        "Ngày đặt phòng không hợp lệ."
                );
            }

            long itemNights = ChronoUnit.DAYS.between(
                    itemCheckIn,
                    itemCheckOut
            );

            BigDecimal itemPrice = item.getRoomPrice();

            if (itemPrice == null) {
                Room itemRoom = roomRepository.findById(item.getRoomId())
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Không tìm thấy phòng có mã: "
                                        + item.getRoomId()
                        ));

                itemPrice = itemRoom.getRoomType().getBasePrice();
            }

            BigDecimal itemTotal = itemPrice
                    .multiply(BigDecimal.valueOf(itemNights))
                    .setScale(0, RoundingMode.HALF_UP);

            BigDecimal itemDiscount = item.getDiscountAmount() != null
                    ? item.getDiscountAmount()
                    : BigDecimal.ZERO;

            if (itemDiscount.compareTo(BigDecimal.ZERO) < 0) {
                itemDiscount = BigDecimal.ZERO;
            }

            if (itemDiscount.compareTo(itemTotal) > 0) {
                itemDiscount = itemTotal;
            }

            totalAmount = totalAmount.add(itemTotal);
            totalDiscountAmount = totalDiscountAmount.add(itemDiscount);
        }

        // 12. Tính thành tiền toàn Booking
        BigDecimal finalAmount = totalAmount
                .subtract(totalDiscountAmount)
                .max(BigDecimal.ZERO);

        // 13. Cập nhật Booking
        booking.setTotalAmount(totalAmount);
        booking.setDiscountAmount(totalDiscountAmount);
        booking.setFinalAmount(finalAmount);

        // Không lấy mã của phòng mới gán vào Booking.
        // Không dùng booking.discountCode để tính giảm giá toàn Booking.
        bookingRepository.save(booking);

        // 14. Trả về Booking mới nhất
        return getAdminBookingDetail(bookingId);
    }

    @Transactional
    public BookingDetailDTO updateRoomInBooking(
            Long bookingId,
            Long bookingRoomId,
            AddBookingRoomRequest request
    ) {
        // 1. Kiểm tra dữ liệu đầu vào
        if (request == null
                || request.getRoomId() == null
                || request.getCheckInDate() == null
                || request.getCheckOutDate() == null
                || request.getGuestCount() == null) {
            throw new IllegalArgumentException(
                    "Vui lòng nhập đầy đủ thông tin phòng."
            );
        }

        LocalDate checkIn = request.getCheckInDate();
        LocalDate checkOut = request.getCheckOutDate();
        Integer guestCount = request.getGuestCount();

        if (checkIn.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "Ngày nhận phòng không được ở trong quá khứ."
            );
        }

        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException(
                    "Ngày trả phòng phải sau ngày nhận phòng."
            );
        }

        if (guestCount < 1) {
            throw new IllegalArgumentException(
                    "Số lượng khách phải lớn hơn 0."
            );
        }

        // 2. Tìm Booking
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy thông tin đặt phòng."
                ));

        if (booking.getStatus() != BookingStatus.PENDING
                && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException(
                    "Chỉ được cập nhật phòng khi Booking đang chờ xác nhận "
                            + "hoặc đã xác nhận."
            );
        }

        // 3. Tìm BookingRoom cần cập nhật
        BookingRoom bookingRoom = bookingRoomRepository.findById(bookingRoomId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy thông tin phòng trong Booking."
                ));

        // Đảm bảo BookingRoom thuộc đúng Booking
        if (!Objects.equals(bookingRoom.getBookingId(), bookingId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Phòng không thuộc Booking này."
            );
        }

        // 4. Tìm phòng vật lý mới
        Room newRoom = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy phòng."
                ));

        if (newRoom.getStatus() != RoomStatus.VACANT) {
            throw new IllegalArgumentException(
                    "Phòng hiện không sẵn sàng để đặt."
            );
        }

        if (newRoom.getRoomType() == null
                || newRoom.getRoomType().getBasePrice() == null) {
            throw new IllegalArgumentException(
                    "Phòng chưa được cấu hình giá."
            );
        }

        // 5. Kiểm tra sức chứa
        Integer capacity = newRoom.getRoomType().getCapacity();

        if (capacity == null || guestCount > capacity) {
            throw new IllegalArgumentException(
                    "Số lượng khách vượt quá sức chứa của phòng."
            );
        }

        // 6. Kiểm tra phòng bị trùng với phòng khác trong cùng Booking
        List<BookingRoom> existingRooms =
                bookingRoomRepository.findByBookingId(bookingId);

        boolean duplicatedInBooking = existingRooms.stream()
                .filter(item -> !Objects.equals(item.getId(), bookingRoomId))
                .anyMatch(item ->
                        Objects.equals(item.getRoomId(), newRoom.getId())
                                && datesOverlap(
                                item.getCheckInDate() != null
                                        ? item.getCheckInDate()
                                        : booking.getCheckInDate(),
                                item.getCheckOutDate() != null
                                        ? item.getCheckOutDate()
                                        : booking.getCheckOutDate(),
                                checkIn,
                                checkOut
                        )
                );

        if (duplicatedInBooking) {
            throw new IllegalArgumentException(
                    "Phòng này đã được sử dụng trong Booking "
                            + "ở khoảng thời gian bị trùng."
            );
        }

        // 7. Kiểm tra lịch phòng với các Booking khác
        boolean isSamePhysicalRoom = Objects.equals(
                bookingRoom.getRoomId(),
                newRoom.getId()
        );

        if (!isSamePhysicalRoom) {
            List<Room> availableRooms =
                    roomRepository.findAvailableRoomsForAdmin(
                            checkIn,
                            checkOut,
                            guestCount,
                            List.of(
                                    BookingStatus.PENDING,
                                    BookingStatus.CONFIRMED,
                                    BookingStatus.CHECKED_IN
                            ),
                            bookingId
                    );

            boolean available = availableRooms.stream()
                    .anyMatch(item ->
                            Objects.equals(item.getId(), newRoom.getId())
                    );

            if (!available) {
                throw new IllegalArgumentException(
                        "Phòng không còn trống trong khoảng thời gian đã chọn."
                );
            }
        }

        // 8. Tính giá phòng theo số đêm
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);

        BigDecimal roomPrice = newRoom.getRoomType().getBasePrice();

        if (roomPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Giá phòng không hợp lệ."
            );
        }

        BigDecimal roomTotal = roomPrice
                .multiply(BigDecimal.valueOf(nights))
                .setScale(0, RoundingMode.HALF_UP);

        // 9. Tính lại giảm giá riêng của phòng đang cập nhật
        String discountCode = discountService.normalizeCode(
                request.getDiscountCode()
        );

        BigDecimal roomDiscount = BigDecimal.ZERO;

        if (discountCode != null && !discountCode.isBlank()) {
            roomDiscount = discountService.calculateDiscount(
                    roomTotal,
                    discountCode
            );

            if (roomDiscount == null
                    || roomDiscount.compareTo(BigDecimal.ZERO) < 0) {
                roomDiscount = BigDecimal.ZERO;
            }

            if (roomDiscount.compareTo(roomTotal) > 0) {
                roomDiscount = roomTotal;
            }
        }

        // 10. Cập nhật BookingRoom
        bookingRoom.setRoomId(newRoom.getId());
        bookingRoom.setRoomPrice(roomPrice);
        bookingRoom.setGuestCount(guestCount);
        bookingRoom.setCheckInDate(checkIn);
        bookingRoom.setCheckOutDate(checkOut);
        bookingRoom.setDiscountCode(discountCode);
        bookingRoom.setDiscountAmount(roomDiscount);

        bookingRoomRepository.save(bookingRoom);

        // 11. Tính lại tổng tiền Booking
        recalculateBookingAmounts(booking);

        // 12. Trả về thông tin Booking mới nhất
        return getAdminBookingDetail(bookingId);
    }
    @Transactional
    public BookingDetailDTO deleteRoomFromBooking(
            Long bookingId,
            Long bookingRoomId
    ) {
        // 1. Tìm Booking
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy thông tin đặt phòng."
                ));

        if (booking.getStatus() != BookingStatus.PENDING
                && booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException(
                    "Chỉ được xóa phòng khi Booking đang chờ xác nhận "
                            + "hoặc đã xác nhận."
            );
        }

        // 2. Tìm BookingRoom
        BookingRoom bookingRoom = bookingRoomRepository.findById(bookingRoomId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy thông tin phòng trong Booking."
                ));

        // 3. Kiểm tra BookingRoom thuộc Booking
        if (!Objects.equals(bookingRoom.getBookingId(), bookingId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Phòng không thuộc Booking này."
            );
        }

        // 4. Kiểm tra số lượng phòng hiện tại
        List<BookingRoom> bookingRooms =
                bookingRoomRepository.findByBookingId(bookingId);

        if (bookingRooms.size() <= 1) {
            throw new IllegalArgumentException(
                    "Booking phải có ít nhất một phòng. "
                            + "Không thể xóa phòng cuối cùng."
            );
        }

        // 5. Xóa BookingRoom, không xóa Room vật lý
        bookingRoomRepository.delete(bookingRoom);

        // 6. Tính lại tổng tiền Booking
        recalculateBookingAmounts(booking);

        // 7. Trả về Booking mới nhất
        return getAdminBookingDetail(bookingId);
    }

    private boolean datesOverlap(
            LocalDate firstCheckIn,
            LocalDate firstCheckOut,
            LocalDate secondCheckIn,
            LocalDate secondCheckOut
    ) {
        if (firstCheckIn == null || firstCheckOut == null
                || secondCheckIn == null || secondCheckOut == null) {
            return false;
        }

        return firstCheckIn.isBefore(secondCheckOut)
                && firstCheckOut.isAfter(secondCheckIn);
    }

    @Transactional(readOnly = true)
    public List<AvailableRoomDTO> getAllRoomTypesForAdmin() {
        return roomTypeRepository.findAll()
                .stream()
                .map(type -> new AvailableRoomDTO(
                        null,
                        null,
                        null,
                        type.getId(),
                        type.getName(),
                        type.getDescription(),
                        type.getCapacity(),
                        type.getArea(),
                        type.getBedType(),
                        type.getBasePrice()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AvailableRoomDTO> getAvailableRoomsForAdmin(
            Long bookingId,
            Long roomTypeId,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            Integer guestCount
    ) {

        if (bookingId == null
                || roomTypeId == null
                || checkInDate == null
                || checkOutDate == null
                || guestCount == null) {
            throw new IllegalArgumentException(
                    "Vui lòng cung cấp đầy đủ thông tin tìm phòng."
            );
        }

        if (checkInDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "Ngày nhận phòng không được ở trong quá khứ."
            );
        }

        if (!checkOutDate.isAfter(checkInDate)) {
            throw new IllegalArgumentException(
                    "Ngày trả phòng phải sau ngày nhận phòng."
            );
        }

        if (guestCount < 1) {
            throw new IllegalArgumentException(
                    "Số lượng khách phải lớn hơn 0."
            );
        }

        RoomType roomType = roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy hạng phòng."
                ));

        if (roomType.getCapacity() == null
                || guestCount > roomType.getCapacity()) {
            throw new IllegalArgumentException(
                    "Số lượng khách vượt quá sức chứa của hạng phòng."
            );
        }


        return roomRepository.findAvailableRoomsForAdmin(
                checkInDate,
                checkOutDate,
                guestCount,
                List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED,
                        BookingStatus.CHECKED_IN),
                bookingId
        )
                .stream()
                .filter(room -> room.getRoomType().getId().equals(roomTypeId))
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
    private void recalculateBookingAmounts(Booking booking) {

        List<BookingRoom> bookingRooms =
                bookingRoomRepository.findByBookingId(booking.getId());

        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalDiscountAmount = BigDecimal.ZERO;

        for (BookingRoom item : bookingRooms) {

            LocalDate checkIn = item.getCheckInDate() != null
                    ? item.getCheckInDate()
                    : booking.getCheckInDate();

            LocalDate checkOut = item.getCheckOutDate() != null
                    ? item.getCheckOutDate()
                    : booking.getCheckOutDate();

            if (checkIn == null
                    || checkOut == null
                    || !checkOut.isAfter(checkIn)) {
                throw new IllegalArgumentException(
                        "Ngày đặt phòng không hợp lệ."
                );
            }

            long nights = ChronoUnit.DAYS.between(checkIn, checkOut);

            BigDecimal roomPrice = item.getRoomPrice();

            if (roomPrice == null) {
                Room room = roomRepository.findById(item.getRoomId())
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Không tìm thấy phòng có mã: " + item.getRoomId()
                        ));

                roomPrice = room.getRoomType().getBasePrice();
            }

            if (roomPrice == null
                    || roomPrice.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException(
                        "Giá phòng không hợp lệ."
                );
            }

            BigDecimal roomTotal = roomPrice
                    .multiply(BigDecimal.valueOf(nights))
                    .setScale(0, RoundingMode.HALF_UP);

            BigDecimal roomDiscount = item.getDiscountAmount() != null
                    ? item.getDiscountAmount()
                    : BigDecimal.ZERO;

            if (roomDiscount.compareTo(BigDecimal.ZERO) < 0) {
                roomDiscount = BigDecimal.ZERO;
            }

            if (roomDiscount.compareTo(roomTotal) > 0) {
                roomDiscount = roomTotal;
            }

            totalAmount = totalAmount.add(roomTotal);
            totalDiscountAmount = totalDiscountAmount.add(roomDiscount);
        }

// Tính tổng chi phí phát sinh của Booking
        BigDecimal extraCostAmount = extraCostRepository
                .findByBooking_Id(booking.getId())
                .stream()
                .map(item -> item.getTotalAmount() != null
                        ? item.getTotalAmount()
                        : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

// Tổng tiền cuối cùng = tiền phòng - giảm giá + chi phí phát sinh
        BigDecimal finalAmount = totalAmount
                .subtract(totalDiscountAmount)
                .add(extraCostAmount)
                .max(BigDecimal.ZERO);

        // Kiểm tra tổng số tiền đã thanh toán thành công
        BigDecimal paidAmount = paymentRepository.sumPaidAmountByBookingId(
                booking.getId(),
                PaymentStatus.PAID
        );

        if (paidAmount == null) {
            paidAmount = BigDecimal.ZERO;
        }

        if (finalAmount.compareTo(paidAmount) < 0) {
            throw new IllegalArgumentException(
                    "Không thể cập nhật hoặc xóa phòng vì tổng tiền Booking "
                            + "sau khi thay đổi thấp hơn số tiền khách đã thanh toán. "
                            + "Vui lòng xử lý khoản hoàn tiền trước."
            );
        }

        booking.setTotalAmount(totalAmount);
        booking.setDiscountAmount(totalDiscountAmount);
        booking.setFinalAmount(finalAmount);

        bookingRepository.save(booking);
    }
    @Transactional
    public BookingDetailDTO updateBookingNote(Long bookingId, String note) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy thông tin đặt phòng."
                ));

        if (note != null) {
            note = note.trim();

            // Loại bỏ dấu ngoặc kép nếu dữ liệu đang bị lưu kèm
            if (note.length() >= 2
                    && note.startsWith("\"")
                    && note.endsWith("\"")) {
                note = note.substring(1, note.length() - 1);
            }

            if (note.isEmpty() || note.equalsIgnoreCase("null")) {
                note = null;
            }
        }

        booking.setNote(note);
        bookingRepository.save(booking);

        return getAdminBookingDetail(bookingId);
    }
}
