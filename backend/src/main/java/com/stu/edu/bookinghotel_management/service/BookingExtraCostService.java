
package com.stu.edu.bookinghotel_management.service;

import com.stu.edu.bookinghotel_management.dto.BookingExtraCostDTO;
import com.stu.edu.bookinghotel_management.entity.Booking;
import com.stu.edu.bookinghotel_management.entity.BookingExtraCost;
import com.stu.edu.bookinghotel_management.repository.BookingExtraCostRepository;
import com.stu.edu.bookinghotel_management.repository.BookingRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingExtraCostService {

    private final BookingExtraCostRepository extraCostRepository;
    private final BookingRepository bookingRepository;

    // Lấy danh sách chi phí phát sinh theo Booking
    @Transactional(readOnly = true)
    public List<BookingExtraCostDTO> getByBookingId(Long bookingId) {

        if (!bookingRepository.existsById(bookingId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Không tìm thấy đơn đặt phòng"
            );
        }

        return extraCostRepository.findByBooking_Id(bookingId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Thêm chi phí phát sinh
    public BookingExtraCostDTO create(
            Long bookingId,
            BookingExtraCostDTO request
    ) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy đơn đặt phòng"
                ));

        validateRequest(request);

        BookingExtraCost extraCost = new BookingExtraCost();

        extraCost.setBooking(booking);
        extraCost.setName(request.getName().trim());
        extraCost.setDescription(request.getDescription());
        extraCost.setQuantity(request.getQuantity());
        extraCost.setUnitPrice(request.getUnitPrice());

        BigDecimal totalAmount = request.getUnitPrice()
                .multiply(BigDecimal.valueOf(request.getQuantity()));

        extraCost.setTotalAmount(totalAmount);
        extraCost.setIncurredDate(request.getIncurredDate());
        extraCost.setNote(request.getNote());

        BookingExtraCost saved = extraCostRepository.save(extraCost);

        // Tính lại tổng tiền Booking sau khi thêm
        recalculateBookingFinalAmount(booking);

        return convertToDTO(saved);
    }

    // Cập nhật chi phí phát sinh
    public BookingExtraCostDTO update(
            Long bookingId,
            Long id,
            BookingExtraCostDTO request
    ) {

        BookingExtraCost extraCost = extraCostRepository
                .findByIdAndBooking_Id(id, bookingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy chi phí phát sinh"
                ));

        validateRequest(request);

        extraCost.setName(request.getName().trim());
        extraCost.setDescription(request.getDescription());
        extraCost.setQuantity(request.getQuantity());
        extraCost.setUnitPrice(request.getUnitPrice());

        BigDecimal totalAmount = request.getUnitPrice()
                .multiply(BigDecimal.valueOf(request.getQuantity()));

        extraCost.setTotalAmount(totalAmount);
        extraCost.setIncurredDate(request.getIncurredDate());
        extraCost.setNote(request.getNote());

        BookingExtraCost updated = extraCostRepository.save(extraCost);

        // Tính lại tổng tiền Booking sau khi cập nhật
        recalculateBookingFinalAmount(extraCost.getBooking());

        return convertToDTO(updated);
    }

    // Xóa chi phí phát sinh
    public void delete(Long bookingId, Long id) {

        BookingExtraCost extraCost = extraCostRepository
                .findByIdAndBooking_Id(id, bookingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy chi phí phát sinh"
                ));

        Booking booking = extraCost.getBooking();

        extraCostRepository.delete(extraCost);

        // Tính lại tổng tiền Booking sau khi xóa
        recalculateBookingFinalAmount(booking);
    }

    // Tính lại tổng tiền cuối cùng của Booking
    private void recalculateBookingFinalAmount(Booking booking) {

        BigDecimal roomTotal = booking.getTotalAmount() != null
                ? booking.getTotalAmount()
                : BigDecimal.ZERO;

        BigDecimal discountAmount = booking.getDiscountAmount() != null
                ? booking.getDiscountAmount()
                : BigDecimal.ZERO;

        BigDecimal extraCostAmount = extraCostRepository
                .findByBooking_Id(booking.getId())
                .stream()
                .map(item -> item.getTotalAmount() != null
                        ? item.getTotalAmount()
                        : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal finalAmount = roomTotal
                .subtract(discountAmount)
                .add(extraCostAmount)
                .max(BigDecimal.ZERO);

        booking.setFinalAmount(finalAmount);

        bookingRepository.save(booking);
    }

    // Kiểm tra dữ liệu đầu vào
    private void validateRequest(BookingExtraCostDTO request) {

        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dữ liệu chi phí không hợp lệ"
            );
        }

        if (request.getName() == null
                || request.getName().trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tên chi phí không được để trống"
            );
        }

        if (request.getQuantity() == null
                || request.getQuantity() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Số lượng phải lớn hơn 0"
            );
        }

        if (request.getUnitPrice() == null
                || request.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Đơn giá không hợp lệ"
            );
        }
    }

    // Chuyển Entity sang DTO
    private BookingExtraCostDTO convertToDTO(BookingExtraCost extraCost) {

        BookingExtraCostDTO dto = new BookingExtraCostDTO();

        dto.setId(extraCost.getId());
        dto.setBookingId(extraCost.getBooking().getId());
        dto.setName(extraCost.getName());
        dto.setDescription(extraCost.getDescription());
        dto.setQuantity(extraCost.getQuantity());
        dto.setUnitPrice(extraCost.getUnitPrice());
        dto.setTotalAmount(extraCost.getTotalAmount());
        dto.setIncurredDate(extraCost.getIncurredDate());
        dto.setNote(extraCost.getNote());

        return dto;
    }
}
