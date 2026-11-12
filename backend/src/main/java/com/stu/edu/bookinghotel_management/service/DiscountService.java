package com.stu.edu.bookinghotel_management.service;
import com.stu.edu.bookinghotel_management.dto.discount.DiscountPreviewRequest;
import com.stu.edu.bookinghotel_management.dto.discount.DiscountPreviewResponse;
import com.stu.edu.bookinghotel_management.entity.DiscountCode;
import com.stu.edu.bookinghotel_management.entity.DiscountType;
import com.stu.edu.bookinghotel_management.entity.Room;
import com.stu.edu.bookinghotel_management.repository.DiscountCodeRepository;
import com.stu.edu.bookinghotel_management.repository.RoomRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class DiscountService {

    private final DiscountCodeRepository discountCodeRepository;
    private final RoomRepository roomRepository;

    /**
     * Chuẩn hóa mã giảm giá.
     */
    public String normalizeCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }

        return code.trim().toUpperCase(Locale.ROOT);
    }

    /**
     * Kiểm tra mã có tồn tại, đang hoạt động và chưa hết hạn.
     */
    @Transactional(readOnly = true)
    public DiscountCode getValidDiscountCode(String code) {
        String normalizedCode = normalizeCode(code);

        if (normalizedCode == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng nhập mã giảm giá."
            );
        }

        DiscountCode discount = discountCodeRepository
                .findByCodeIgnoreCase(normalizedCode)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Mã giảm giá không tồn tại."
                ));

        if (!discount.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mã giảm giá hiện không hoạt động."
            );
        }

        if (discount.getExpiresAt() == null
                || LocalDate.now().isAfter(discount.getExpiresAt())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mã giảm giá đã hết hạn."
            );
        }

        if (discount.getDiscountValue() == null
                || discount.getDiscountValue().compareTo(
                BigDecimal.ZERO
        ) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mã giảm giá có giá trị không hợp lệ."
            );
        }

        if (discount.getDiscountType() == DiscountType.PERCENT
                && discount.getDiscountValue().compareTo(
                new BigDecimal("100")
        ) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Phần trăm giảm giá không được vượt quá 100%."
            );
        }

        return discount;
    }

    /**
     * Tính tiền giảm.
     *
     * code null hoặc rỗng nghĩa là khách không sử dụng mã.
     */
    @Transactional(readOnly = true)
    public BigDecimal calculateDiscount(
            BigDecimal totalAmount,
            String code
    ) {
        if (totalAmount == null
                || totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tổng tiền không hợp lệ."
            );
        }

        String normalizedCode = normalizeCode(code);

        if (normalizedCode == null) {
            return BigDecimal.ZERO;
        }

        DiscountCode discount =
                getValidDiscountCode(normalizedCode);

        BigDecimal discountAmount;

        if (discount.getDiscountType() == DiscountType.PERCENT) {
            discountAmount = totalAmount
                    .multiply(discount.getDiscountValue())
                    .divide(
                            new BigDecimal("100"),
                            0,
                            RoundingMode.HALF_UP
                    );
        } else {
            discountAmount = discount.getDiscountValue()
                    .setScale(0, RoundingMode.HALF_UP);
        }

        // Không cho số tiền giảm vượt quá tổng tiền phòng.
        if (discountAmount.compareTo(totalAmount) > 0) {
            discountAmount = totalAmount;
        }

        return discountAmount.max(BigDecimal.ZERO);
    }

    /**
     * Kiểm tra mã và xem trước số tiền cho giao diện React.
     *
     * Đây chỉ là bước xem trước.
     * Khi tạo giao dịch thật, PaymentService vẫn tự tính lại.
     */
    @Transactional(readOnly = true)
    public DiscountPreviewResponse previewDiscount(
            DiscountPreviewRequest request
    ) {
        if (request == null
                || request.getRoomId() == null
                || request.getCheckInDate() == null
                || request.getCheckOutDate() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vui lòng cung cấp đầy đủ thông tin đặt phòng."
            );
        }

        LocalDate checkIn = request.getCheckInDate();
        LocalDate checkOut = request.getCheckOutDate();

        if (checkIn.isBefore(LocalDate.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ngày nhận phòng không được ở trong quá khứ."
            );
        }

        if (!checkOut.isAfter(checkIn)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ngày trả phòng phải sau ngày nhận phòng."
            );
        }

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy phòng."
                ));

        if (room.getRoomType() == null
                || room.getRoomType().getBasePrice() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Phòng chưa được cấu hình giá."
            );
        }

        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);

        BigDecimal totalAmount = room.getRoomType()
                .getBasePrice()
                .multiply(BigDecimal.valueOf(nights))
                .setScale(0, RoundingMode.HALF_UP);

        BigDecimal discountAmount = calculateDiscount(
                totalAmount,
                request.getDiscountCode()
        );

        BigDecimal finalAmount = totalAmount
                .subtract(discountAmount);

        DiscountCode discount = getValidDiscountCode(
                request.getDiscountCode()
        );

        return new DiscountPreviewResponse(
                discount.getCode(),
                discount.getDiscountType().name(),
                totalAmount,
                discountAmount,
                finalAmount,
                "Áp dụng mã giảm giá thành công."
        );
    }
}