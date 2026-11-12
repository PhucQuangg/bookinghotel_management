
package com.stu.edu.bookinghotel_management.service;

import com.stu.edu.bookinghotel_management.dto.payment.CreatePaymentRequest;
import com.stu.edu.bookinghotel_management.dto.payment.PaymentHistoryDTO;
import com.stu.edu.bookinghotel_management.entity.*;
import com.stu.edu.bookinghotel_management.repository.BookingRepository;
import com.stu.edu.bookinghotel_management.repository.BookingRoomRepository;
import com.stu.edu.bookinghotel_management.repository.CustomerRepository;
import com.stu.edu.bookinghotel_management.repository.PaymentRepository;
import com.stu.edu.bookinghotel_management.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final BookingRoomRepository bookingRoomRepository;
    private final CustomerRepository customerRepository;
    private final RoomRepository roomRepository;
    private final BookingService bookingService;
    private final DiscountService discountService;

    @Value("${vnpay.url}")
    private String vnpayUrl;

    @Value("${vnpay.tmn-code}")
    private String vnpayTmnCode;

    @Value("${vnpay.hash-secret}")
    private String vnpayHashSecret;

    @Value("${vnpay.return-url}")
    private String vnpayReturnUrl;

    private static final ZoneId VN_ZONE =
            ZoneId.of("Asia/Ho_Chi_Minh");

    private static final DateTimeFormatter VN_DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");


    // =====================================================
    // 1. NHẬN VÀ KIỂM TRA REQUEST CHECKOUT
    // =====================================================

    /**
     * Nhận dữ liệu checkout từ Controller.
     * Kiểm tra dữ liệu đầu vào và gọi nghiệp vụ tạo checkout.
     */
    @Transactional
    public Map<String, Object> createCheckout(
            Map<String, Object> request,
            String username,
            String ipAddress
    ) {
        if (request == null || request.isEmpty()) {
            throw new IllegalArgumentException(
                    "Vui lòng cung cấp thông tin đặt phòng."
            );
        }

        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException(
                    "Không xác định được tài khoản khách hàng."
            );
        }

        try {
            // Mã phòng
            Object roomIdValue = request.get("roomId");

            if (roomIdValue == null) {
                throw new IllegalArgumentException(
                        "Vui lòng chọn phòng."
                );
            }

            Long roomId = Long.valueOf(
                    String.valueOf(roomIdValue)
            );

            // Ngày nhận phòng
            Object checkInValue = request.get("checkInDate");

            if (checkInValue == null
                    || String.valueOf(checkInValue).isBlank()) {
                throw new IllegalArgumentException(
                        "Vui lòng chọn ngày nhận phòng."
                );
            }

            LocalDate checkInDate = LocalDate.parse(
                    String.valueOf(checkInValue)
            );

            // Ngày trả phòng
            Object checkOutValue = request.get("checkOutDate");

            if (checkOutValue == null
                    || String.valueOf(checkOutValue).isBlank()) {
                throw new IllegalArgumentException(
                        "Vui lòng chọn ngày trả phòng."
                );
            }

            LocalDate checkOutDate = LocalDate.parse(
                    String.valueOf(checkOutValue)
            );

            // Số lượng khách
            Object guestCountValue = request.get("guestCount");

            if (guestCountValue == null) {
                throw new IllegalArgumentException(
                        "Vui lòng nhập số lượng khách."
                );
            }

            Integer guestCount = Integer.valueOf(
                    String.valueOf(guestCountValue)
            );

            // Ghi chú
            String note = request.get("note") == null
                    ? ""
                    : String.valueOf(request.get("note")).trim();

            // Phương thức thanh toán
            String paymentMethod = request.get("paymentMethod") == null
                    ? "VNPAY"
                    : String.valueOf(
                    request.get("paymentMethod")
            ).trim();

            if (!"VNPAY".equalsIgnoreCase(paymentMethod)) {
                throw new IllegalArgumentException(
                        "Phương thức thanh toán không được hỗ trợ."
                );
            }

            // Mã giảm giá
            String discountCode = request.get("discountCode") == null
                    ? null
                    : String.valueOf(
                    request.get("discountCode")
            ).trim();

            if (discountCode != null && discountCode.isBlank()) {
                discountCode = null;
            }

            // Gọi nghiệp vụ checkout hiện tại
            return createCheckout(
                    roomId,
                    checkInDate,
                    checkOutDate,
                    guestCount,
                    note,
                    discountCode,
                    username,
                    ipAddress
            );

        } catch (NumberFormatException | DateTimeParseException e) {
            throw new IllegalArgumentException(
                    "Thông tin đặt phòng không đúng định dạng."
            );
        }
    }


    // =====================================================
    // 2. TẠO GIAO DỊCH CHECKOUT VNPay
    // =====================================================

    /**
     * Tạo giao dịch VNPay nhưng chưa tạo Booking.
     */
    @Transactional
    public Map<String, Object> createCheckout(
            Long roomId,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            Integer guestCount,
            String note,
            String discountCode,
            String username,
            String ipAddress
    ) {
        if (roomId == null
                || checkInDate == null
                || checkOutDate == null) {
            throw new IllegalArgumentException(
                    "Vui lòng cung cấp đầy đủ thông tin đặt phòng."
            );
        }

        if (!checkOutDate.isAfter(checkInDate)) {
            throw new IllegalArgumentException(
                    "Ngày trả phòng phải sau ngày nhận phòng."
            );
        }

        if (guestCount == null || guestCount < 1) {
            throw new IllegalArgumentException(
                    "Số lượng khách không hợp lệ."
            );
        }

        Customer customer = customerRepository.findAll()
                .stream()
                .filter(c -> c.getUser() != null
                        && c.getUser().getUsername() != null
                        && c.getUser().getUsername()
                        .equalsIgnoreCase(username))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy thông tin khách hàng."
                ));

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy phòng."
                ));

        if (room.getRoomType() == null
                || room.getRoomType().getBasePrice() == null) {
            throw new IllegalArgumentException(
                    "Phòng chưa được cấu hình giá."
            );
        }

        Integer capacity = room.getRoomType().getCapacity();

        if (capacity != null && guestCount > capacity) {
            throw new IllegalArgumentException(
                    "Số lượng khách vượt quá sức chứa của phòng."
            );
        }

        if (room.getStatus() != RoomStatus.VACANT) {
            throw new IllegalArgumentException(
                    "Phòng hiện không sẵn sàng để đặt."
            );
        }

        // Kiểm tra phòng có bị trùng lịch hay không.
        if (!isRoomAvailable(roomId, checkInDate, checkOutDate)) {
            throw new IllegalArgumentException(
                    "Phòng đã được đặt trong khoảng thời gian này."
            );
        }

        long nights = java.time.temporal.ChronoUnit.DAYS.between(
                checkInDate,
                checkOutDate
        );

        BigDecimal totalAmount = room.getRoomType()
                .getBasePrice()
                .multiply(BigDecimal.valueOf(nights))
                .setScale(0, RoundingMode.HALF_UP);

        // Tính giảm giá ở backend.
        BigDecimal discountAmount = discountService.calculateDiscount(
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

        BigDecimal finalAmount = totalAmount
                .subtract(discountAmount)
                .max(BigDecimal.ZERO)
                .setScale(0, RoundingMode.HALF_UP);

        String normalizedDiscountCode =
                discountService.normalizeCode(discountCode);

        if (finalAmount.signum() <= 0) {
            throw new IllegalArgumentException(
                    "Tổng tiền đặt phòng không hợp lệ."
            );
        }

        // Tiền cọc bằng 30% tổng tiền sau giảm giá.
        BigDecimal depositAmount = finalAmount
                .multiply(new BigDecimal("0.30"))
                .setScale(0, RoundingMode.HALF_UP);

        Payment payment = new Payment();

        payment.setBooking(null);
        payment.setCustomer(customer);
        payment.setRoomId(roomId);
        payment.setCheckInDate(checkInDate);
        payment.setCheckOutDate(checkOutDate);
        payment.setGuestCount(guestCount);
        payment.setBookingNote(note);
        payment.setTotalAmount(totalAmount);
        payment.setDiscountAmount(discountAmount);
        payment.setFinalAmount(finalAmount);
        payment.setDiscountCode(normalizedDiscountCode);

        payment.setPaymentReference(
                "GS" + System.currentTimeMillis()
                        + UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 6)
        );

        payment.setAmount(depositAmount);
        payment.setPaymentMethod(PaymentMethod.VNPAY);
        payment.setPaymentStatus(PaymentStatus.PENDING);

        Payment savedPayment = paymentRepository.save(payment);

        String paymentUrl = createVnpayUrl(
                savedPayment,
                ipAddress
        );

        savedPayment.setPaymentUrl(paymentUrl);
        paymentRepository.save(savedPayment);

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("paymentId", savedPayment.getId());
        response.put(
                "paymentReference",
                savedPayment.getPaymentReference()
        );
        response.put("paymentUrl", paymentUrl);
        response.put("amount", depositAmount);
        response.put("totalAmount", totalAmount);
        response.put("discountAmount", discountAmount);
        response.put("finalAmount", finalAmount);
        response.put("discountCode", normalizedDiscountCode);
        response.put(
                "paymentStatus",
                savedPayment.getPaymentStatus().name()
        );
        response.put(
                "message",
                "Đã tạo giao dịch. Vui lòng thanh toán tiền cọc VNPay."
        );

        return response;
    }


    // =====================================================
    // 3. KIỂM TRA LỊCH PHÒNG
    // =====================================================

    /**
     * Chỉ các Booking PENDING, CONFIRMED hoặc CHECKED_IN
     * mới được tính là đang giữ phòng.
     */
    private boolean isRoomAvailable(
            Long roomId,
            LocalDate checkIn,
            LocalDate checkOut
    ) {
        if (roomId == null
                || checkIn == null
                || checkOut == null
                || !checkOut.isAfter(checkIn)) {
            return false;
        }

        List<Booking> bookings = bookingRepository.findAll();

        List<BookingRoom> bookingRooms =
                bookingRoomRepository.findAll();

        Map<Long, Booking> bookingMap = new HashMap<>();

        for (Booking booking : bookings) {
            if (booking != null && booking.getId() != null) {
                bookingMap.put(booking.getId(), booking);
            }
        }

        for (BookingRoom bookingRoom : bookingRooms) {
            if (bookingRoom == null
                    || !Objects.equals(
                    bookingRoom.getRoomId(),
                    roomId
            )) {
                continue;
            }

            Booking booking = bookingMap.get(
                    bookingRoom.getBookingId()
            );

            if (booking == null
                    || booking.getStatus() == null) {
                continue;
            }

            String status = booking.getStatus().name();

            boolean isBlockingStatus =
                    "PENDING".equals(status)
                            || "CONFIRMED".equals(status)
                            || "CHECKED_IN".equals(status);

            if (!isBlockingStatus) {
                continue;
            }

            LocalDate existingCheckIn = booking.getCheckInDate();
            LocalDate existingCheckOut = booking.getCheckOutDate();

            if (existingCheckIn == null
                    || existingCheckOut == null) {
                continue;
            }

            boolean overlaps =
                    checkIn.isBefore(existingCheckOut)
                            && checkOut.isAfter(existingCheckIn);

            if (overlaps) {
                return false;
            }
        }

        return true;
    }


    // =====================================================
    // 4. XỬ LÝ VNPay IPN
    // =====================================================

    /**
     * VNPay gọi IPN để xác nhận giao dịch.
     * Chỉ tạo Booking sau khi xác minh thanh toán thành công.
     */
    @Transactional
    public Map<String, String> processVnpayIpn(
            Map<String, String> params
    ) {
        if (params == null || params.isEmpty()) {
            return ipnResult("97", "Invalid request");
        }

        String receivedHash = params.get("vnp_SecureHash");

        if (receivedHash == null || receivedHash.isBlank()) {
            return ipnResult("97", "Invalid signature");
        }

        String calculatedHash = createSecureHash(params);

        if (!calculatedHash.equalsIgnoreCase(receivedHash)) {
            return ipnResult("97", "Invalid signature");
        }

        if (!vnpayTmnCode.equals(params.get("vnp_TmnCode"))) {
            return ipnResult("97", "Invalid merchant");
        }

        String reference = params.get("vnp_TxnRef");

        Payment payment = paymentRepository
                .findByPaymentReference(reference)
                .orElse(null);

        if (payment == null) {
            return ipnResult("01", "Payment not found");
        }

        // IPN gửi lại: không tạo Booking hoặc gửi email lần nữa.
        if (payment.getPaymentStatus() == PaymentStatus.PAID
                && payment.getBooking() != null) {
            return ipnResult("00", "Confirm Success");
        }

        String amountParam = params.get("vnp_Amount");

        if (amountParam == null || !amountParam.matches("\\d+")) {
            return ipnResult("04", "Invalid amount");
        }

        long expectedAmount = payment.getAmount()
                .multiply(new BigDecimal("100"))
                .longValue();

        if (Long.parseLong(amountParam) != expectedAmount) {
            return ipnResult("04", "Invalid amount");
        }

        String responseCode = params.get("vnp_ResponseCode");

        String transactionStatus =
                params.get("vnp_TransactionStatus");

        // Giao dịch thất bại hoặc bị hủy.
        if (!"00".equals(responseCode)
                || !"00".equals(transactionStatus)) {

            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);

            return ipnResult("00", "Confirm Success");
        }

        // Payment đã có Booking liên kết.
        if (payment.getBooking() != null) {
            payment.setPaymentStatus(PaymentStatus.PAID);

            payment.setProviderTransactionNo(
                    params.get("vnp_TransactionNo")
            );

            payment.setPaidAt(
                    ZonedDateTime.now(VN_ZONE).toLocalDateTime()
            );

            paymentRepository.save(payment);

            return ipnResult("00", "Confirm Success");
        }

        // Kiểm tra thông tin cần thiết để tạo Booking.
        if (payment.getCustomer() == null
                || payment.getRoomId() == null
                || payment.getCheckInDate() == null
                || payment.getCheckOutDate() == null) {
            return ipnResult(
                    "99",
                    "Missing booking information"
            );
        }

        if (!payment.getCheckOutDate().isAfter(
                payment.getCheckInDate()
        )) {
            return ipnResult("99", "Invalid booking dates");
        }

        Room room = roomRepository.findById(payment.getRoomId())
                .orElse(null);

        if (room == null) {
            return ipnResult("01", "Room not found");
        }

        // Kiểm tra lại lịch phòng khi VNPay gửi IPN.
        if (!isRoomAvailable(
                payment.getRoomId(),
                payment.getCheckInDate(),
                payment.getCheckOutDate()
        )) {
            payment.setPaymentStatus(PaymentStatus.PAID);

            payment.setProviderTransactionNo(
                    params.get("vnp_TransactionNo")
            );

            payment.setPaidAt(
                    ZonedDateTime.now(VN_ZONE).toLocalDateTime()
            );

            paymentRepository.save(payment);

            return ipnResult(
                    "00",
                    "Payment received; room unavailable"
            );
        }

        // Tạo Booking sau khi thanh toán thành công.
        Booking booking = new Booking();

        booking.setBookingCode(
                "GS" + System.currentTimeMillis()
                        + UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 6)
        );

        booking.setCustomer(payment.getCustomer());
        booking.setCheckInDate(payment.getCheckInDate());
        booking.setCheckOutDate(payment.getCheckOutDate());
        booking.setGuestCount(payment.getGuestCount());
        booking.setTotalAmount(payment.getTotalAmount());
        booking.setDiscountAmount(payment.getDiscountAmount());
        booking.setFinalAmount(payment.getFinalAmount());
        booking.setDiscountCode(payment.getDiscountCode());
        booking.setNote(payment.getBookingNote());
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setCreatedByRole(Role.CUSTOMER);

        Booking savedBooking = bookingRepository.save(booking);

        long nights = java.time.temporal.ChronoUnit.DAYS.between(
                payment.getCheckInDate(),
                payment.getCheckOutDate()
        );

        if (nights <= 0) {
            return ipnResult("99", "Invalid booking dates");
        }

        BookingRoom bookingRoom = new BookingRoom();

        bookingRoom.setBookingId(savedBooking.getId());
        bookingRoom.setRoomId(payment.getRoomId());

        bookingRoom.setRoomPrice(
                payment.getFinalAmount().divide(
                        BigDecimal.valueOf(nights),
                        2,
                        RoundingMode.HALF_UP
                )
        );

        bookingRoom.setGuestCount(payment.getGuestCount());

        bookingRoomRepository.save(bookingRoom);

        // Cập nhật Payment và liên kết với Booking.
        payment.setBooking(savedBooking);
        payment.setPaymentStatus(PaymentStatus.PAID);

        payment.setProviderTransactionNo(
                params.get("vnp_TransactionNo")
        );

        payment.setPaidAt(
                ZonedDateTime.now(VN_ZONE).toLocalDateTime()
        );

        paymentRepository.save(payment);

        // Gửi email xác nhận Booking.
        try {
            bookingService.sendBookingConfirmationEmail(
                    savedBooking.getId()
            );
        } catch (Exception e) {
            System.err.println(
                    "Lỗi gửi email xác nhận booking "
                            + savedBooking.getBookingCode()
                            + ": " + e.getMessage()
            );
        }

        return ipnResult("00", "Confirm Success");
    }


    // =====================================================
    // 5. TẠO URL VNPAY
    // =====================================================

    private String createVnpayUrl(
            Payment payment,
            String ipAddress
    ) {
        ZonedDateTime now = ZonedDateTime.now(VN_ZONE);

        Map<String, String> params = new TreeMap<>();

        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", vnpayTmnCode);

        params.put(
                "vnp_Amount",
                payment.getAmount()
                        .multiply(new BigDecimal("100"))
                        .longValueExact() + ""
        );

        params.put("vnp_CurrCode", "VND");

        params.put(
                "vnp_TxnRef",
                payment.getPaymentReference()
        );

        params.put(
                "vnp_OrderInfo",
                "Thanh toan tien coc GrandStay "
                        + payment.getPaymentReference()
        );

        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", vnpayReturnUrl);
        params.put("vnp_IpAddr", normalizeIp(ipAddress));

        params.put(
                "vnp_CreateDate",
                now.format(VN_DATE_FORMAT)
        );

        params.put(
                "vnp_ExpireDate",
                now.plusMinutes(15).format(VN_DATE_FORMAT)
        );

        String query = buildQuery(params);

        String secureHash = hmacSHA512(
                vnpayHashSecret,
                query
        );

        return vnpayUrl
                + "?"
                + query
                + "&vnp_SecureHash="
                + secureHash;
    }


    // =====================================================
    // 6. XÁC MINH CHỮ KÝ VNPAY
    // =====================================================

    private String createSecureHash(
            Map<String, String> params
    ) {
        Map<String, String> filtered = new TreeMap<>(params);

        filtered.remove("vnp_SecureHash");
        filtered.remove("vnp_SecureHashType");

        return hmacSHA512(
                vnpayHashSecret,
                buildQuery(filtered)
        );
    }

    private String buildQuery(
            Map<String, String> params
    ) {
        StringBuilder query = new StringBuilder();

        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (entry.getValue() == null) {
                continue;
            }

            if (query.length() > 0) {
                query.append('&');
            }

            query.append(
                    URLEncoder.encode(
                            entry.getKey(),
                            StandardCharsets.UTF_8
                    )
            );

            query.append('=');

            query.append(
                    URLEncoder.encode(
                            entry.getValue(),
                            StandardCharsets.UTF_8
                    )
            );
        }

        return query.toString();
    }

    private String hmacSHA512(
            String key,
            String data
    ) {
        try {
            javax.crypto.Mac hmac =
                    javax.crypto.Mac.getInstance("HmacSHA512");

            javax.crypto.spec.SecretKeySpec secretKey =
                    new javax.crypto.spec.SecretKeySpec(
                            key.getBytes(StandardCharsets.UTF_8),
                            "HmacSHA512"
                    );

            hmac.init(secretKey);

            byte[] bytes = hmac.doFinal(
                    data.getBytes(StandardCharsets.UTF_8)
            );

            StringBuilder hex = new StringBuilder();

            for (byte b : bytes) {
                hex.append(
                        String.format("%02x", b & 0xff)
                );
            }

            return hex.toString();

        } catch (Exception e) {
            throw new IllegalStateException(
                    "Không thể tạo chữ ký VNPay.",
                    e
            );
        }
    }

    private String normalizeIp(String ipAddress) {
        if (ipAddress == null
                || ipAddress.isBlank()
                || "::1".equals(ipAddress)
                || "0:0:0:0:0:0:0:1".equals(ipAddress)) {
            return "127.0.0.1";
        }

        return ipAddress;
    }

    private Map<String, String> ipnResult(
            String code,
            String message
    ) {
        Map<String, String> result = new LinkedHashMap<>();

        result.put("RspCode", code);
        result.put("Message", message);

        return result;
    }


    // =====================================================
    // 7. XỬ LÝ KẾT QUẢ VNPAY RETURN
    // =====================================================

    @Transactional
    public Map<String, Object> processVnpayReturn(
            Map<String, String> params
    ) {
        Map<String, Object> result = new LinkedHashMap<>();

        if (params == null || params.isEmpty()) {
            result.put("success", false);
            result.put("pending", false);
            result.put("message", "Dữ liệu thanh toán không hợp lệ.");

            return result;
        }

        String responseCode = params.get("vnp_ResponseCode");

        String transactionStatus =
                params.get("vnp_TransactionStatus");

        if (!"00".equals(responseCode)
                || !"00".equals(transactionStatus)) {

            result.put("success", false);
            result.put("pending", false);

            result.put(
                    "message",
                    "Giao dịch không thành công hoặc đã bị hủy."
            );

            return result;
        }

        // Xác minh chữ ký và xử lý giao dịch.
        Map<String, String> ipnResponse =
                processVnpayIpn(params);

        if (!"00".equals(ipnResponse.get("RspCode"))) {
            result.put("success", false);
            result.put("pending", false);

            result.put(
                    "message",
                    "Không thể xác minh giao dịch: "
                            + ipnResponse.get("Message")
            );

            return result;
        }

        String reference = params.get("vnp_TxnRef");

        Payment payment = paymentRepository
                .findByPaymentReference(reference)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy giao dịch thanh toán."
                ));

        // Chỉ báo thành công khi đã có Booking liên kết.
        if (payment.getPaymentStatus() != PaymentStatus.PAID
                || payment.getBooking() == null) {

            result.put("success", false);
            result.put("pending", true);

            result.put(
                    "message",
                    "Giao dịch chưa được xác nhận hoàn tất. "
                            + "Vui lòng kiểm tra lại sau."
            );

            return result;
        }

        Booking booking = payment.getBooking();

        result.put("success", true);
        result.put("pending", false);
        result.put("message", "Đặt phòng thành công.");

        result.put("bookingId", booking.getId());
        result.put("bookingCode", booking.getBookingCode());
        result.put("bookingStatus", booking.getStatus().name());

        result.put(
                "paymentStatus",
                payment.getPaymentStatus().name()
        );

        result.put(
                "paymentReference",
                payment.getPaymentReference()
        );

        return result;
    }


    // =====================================================
    // 8. LỊCH SỬ THANH TOÁN KHÁCH HÀNG
    // =====================================================

    @Transactional(readOnly = true)
    public List<PaymentHistoryDTO> getPaymentHistory(
            String username
    ) {
        List<Payment> payments =
                paymentRepository
                        .findAllByCustomer_User_UsernameOrderByCreatedAtDesc(
                                username
                        );

        return payments.stream()
                .map(this::convertToPaymentHistoryDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public PaymentHistoryDTO getPaymentHistoryDetail(
            Long paymentId,
            String username
    ) {
        Payment payment = paymentRepository
                .findByIdAndCustomer_User_Username(paymentId, username)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy giao dịch thanh toán."
                ));

        return convertToPaymentHistoryDTO(payment);
    }

    private PaymentHistoryDTO convertToPaymentHistoryDTO(
            Payment payment
    ) {
        String bookingCode = null;

        if (payment.getBooking() != null) {
            bookingCode = payment.getBooking().getBookingCode();
        }

        return PaymentHistoryDTO.builder()
                .id(payment.getId())
                .paymentReference(payment.getPaymentReference())
                .bookingCode(bookingCode)
                .amount(payment.getAmount())
                .totalAmount(payment.getTotalAmount())
                .discountAmount(payment.getDiscountAmount())
                .finalAmount(payment.getFinalAmount())
                .discountCode(payment.getDiscountCode())
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus())
                .providerTransactionNo(
                        payment.getProviderTransactionNo()
                )
                .roomId(payment.getRoomId())
                .checkInDate(payment.getCheckInDate())
                .checkOutDate(payment.getCheckOutDate())
                .guestCount(payment.getGuestCount())
                .createdAt(payment.getCreatedAt())
                .paidAt(payment.getPaidAt())
                .build();
    }


    // =====================================================
    // 9. THANH TOÁN THEO BOOKING
    // =====================================================

    @Transactional(readOnly = true)
    public List<PaymentHistoryDTO> getPaymentsByBooking(
            Long bookingId
    ) {
        if (!bookingRepository.existsById(bookingId)) {
            throw new IllegalArgumentException(
                    "Không tìm thấy booking."
            );
        }

        return paymentRepository
                .findAllByBooking_IdOrderByCreatedAtDesc(bookingId)
                .stream()
                .map(this::convertToPaymentHistoryDTO)
                .toList();
    }


    // =====================================================
    // 10. ADMIN TẠO KHOẢN THANH TOÁN THỦ CÔNG
    // =====================================================

    @Transactional
    public PaymentHistoryDTO createPayment(
            Long bookingId,
            CreatePaymentRequest request
    ) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy booking."
                        )
                );

        if (request == null) {
            throw new IllegalArgumentException(
                    "Vui lòng cung cấp thông tin thanh toán."
            );
        }

        // Kiểm tra số tiền.
        if (request.getAmount() == null
                || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Số tiền thanh toán phải lớn hơn 0."
            );
        }

        // Kiểm tra phương thức thanh toán.
        if (request.getPaymentMethod() == null) {
            throw new IllegalArgumentException(
                    "Vui lòng chọn phương thức thanh toán."
            );
        }

        if (booking.getFinalAmount() == null) {
            throw new IllegalArgumentException(
                    "Booking chưa có thông tin thành tiền."
            );
        }

        // Tính tổng số tiền đã thanh toán thành công.
        BigDecimal paidAmount =
                paymentRepository.sumPaidAmountByBookingId(
                        bookingId,
                        PaymentStatus.PAID
                );

        if (paidAmount == null) {
            paidAmount = BigDecimal.ZERO;
        }

        // Tính số tiền còn phải thanh toán.
        BigDecimal remainingAmount = booking.getFinalAmount()
                .subtract(paidAmount);

        if (remainingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Booking đã được thanh toán đủ."
            );
        }

        // Không cho phép thanh toán vượt quá số tiền còn lại.
        if (request.getAmount().compareTo(remainingAmount) > 0) {
            throw new IllegalArgumentException(
                    "Số tiền thanh toán vượt quá số tiền còn phải trả: "
                            + remainingAmount
            );
        }

        Payment payment = new Payment();

        payment.setBooking(booking);
        payment.setCustomer(booking.getCustomer());

        payment.setPaymentReference(
                "ADM" + UUID.randomUUID()
                        .toString()
                        .replace("-", "")
                        .substring(0, 12)
                        .toUpperCase()
        );

        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());

        payment.setPaymentStatus(PaymentStatus.PAID);

        payment.setPaidAt(
                LocalDateTime.now(VN_ZONE)
        );

        payment.setTotalAmount(booking.getTotalAmount());
        payment.setDiscountAmount(booking.getDiscountAmount());
        payment.setFinalAmount(booking.getFinalAmount());

        payment.setCheckInDate(booking.getCheckInDate());
        payment.setCheckOutDate(booking.getCheckOutDate());

        Payment savedPayment = paymentRepository.save(payment);

        return convertToPaymentHistoryDTO(savedPayment);
    }


    // =====================================================
    // 11. ADMIN CẬP NHẬT THANH TOÁN
    // =====================================================

    @Transactional
    public Payment updatePayment(
            Long bookingId,
            Long paymentId,
            Payment request
    ) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy đặt phòng."
                        )
                );

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy thanh toán."
                        )
                );

        if (payment.getBooking() == null
                || !payment.getBooking().getId().equals(bookingId)) {
            throw new IllegalArgumentException(
                    "Thanh toán không thuộc đặt phòng này."
            );
        }

        if (request == null) {
            throw new IllegalArgumentException(
                    "Vui lòng cung cấp thông tin thanh toán."
            );
        }

        if (request.getAmount() == null
                || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Số tiền thanh toán phải lớn hơn 0."
            );
        }

        if (request.getPaymentMethod() == null) {
            throw new IllegalArgumentException(
                    "Vui lòng chọn phương thức thanh toán."
            );
        }

        if (request.getPaymentStatus() == null) {
            throw new IllegalArgumentException(
                    "Vui lòng chọn trạng thái thanh toán."
            );
        }

        // Không sửa giao dịch VNPay đã phát sinh mã giao dịch thực tế.
        if (payment.getPaymentMethod() == PaymentMethod.VNPAY
                && payment.getProviderTransactionNo() != null
                && !payment.getProviderTransactionNo().isBlank()) {
            throw new IllegalArgumentException(
                    "Không thể chỉnh sửa giao dịch VNPay đã phát sinh."
            );
        }

        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setPaymentStatus(request.getPaymentStatus());

        if (request.getPaymentStatus() == PaymentStatus.PAID) {
            LocalDateTime paidAt = request.getPaidAt() != null
                    ? request.getPaidAt()
                    : LocalDateTime.now(VN_ZONE);

            payment.setPaidAt(paidAt);
        } else {
            payment.setPaidAt(null);
        }

        return paymentRepository.save(payment);
    }
}
