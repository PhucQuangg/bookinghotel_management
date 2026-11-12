
package com.stu.edu.bookinghotel_management.service;

import com.stu.edu.bookinghotel_management.dto.BookingCreatedDTO;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    private static final Logger log =
            LoggerFactory.getLogger(EmailService.class);

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Gửi email xác nhận sau khi tạo booking thành công.
     */
    @Async
    public void sendConfirmBookingEmails(
            String to,
            String customerName,
            BookingCreatedDTO booking
    ) {
        if (to == null || to.isBlank() || booking == null) {
            log.warn("Thiếu thông tin gửi email xác nhận booking.");
            return;
        }

        try {
            String name = escapeHtml(
                    customerName == null || customerName.isBlank()
                            ? "Quý khách"
                            : customerName
            );

            String bookingCode = escapeHtml(booking.getBookingCode());
            String roomName = escapeHtml(booking.getRoomTypeName());
            String roomNumber = escapeHtml(booking.getRoomNumber());

            String checkIn = booking.getCheckInDate()
                    .format(DATE_FORMATTER);

            String checkOut = booking.getCheckOutDate()
                    .format(DATE_FORMATTER);

            String guestCount = String.valueOf(booking.getGuestCount());
            String nights = String.valueOf(booking.getTotalNights());

            String status = String.valueOf(booking.getStatus());

            BigDecimal total = booking.getTotalAmount() == null
                    ? BigDecimal.ZERO
                    : booking.getTotalAmount();

            BigDecimal discount = booking.getDiscountAmount() == null
                    ? BigDecimal.ZERO
                    : booking.getDiscountAmount();

            BigDecimal finalAmount = booking.getFinalAmount() == null
                    ? BigDecimal.ZERO
                    : booking.getFinalAmount();

            String discountCode = booking.getDiscountCode() == null
                    ? ""
                    : escapeHtml(booking.getDiscountCode());

            // Tiền cọc 30% tính trên thành tiền sau giảm giá.
            BigDecimal depositAmount = finalAmount
                    .multiply(new BigDecimal("0.30"))
                    .setScale(0, RoundingMode.HALF_UP);

            // Số tiền còn lại cần thanh toán.
            BigDecimal remainingAmount = finalAmount
                    .subtract(depositAmount);

            String totalAmountText = formatMoney(total);
            String discountAmountText = formatMoney(discount);
            String finalAmountText = formatMoney(finalAmount);
            String depositAmountText = formatMoney(depositAmount);
            String remainingAmountText = formatMoney(remainingAmount);

            String statusText = "PENDING".equalsIgnoreCase(status)
                    ? "Đang chờ xác nhận / Pending confirmation"
                    : status;

            /*
             * Nội dung email HTML.
             * Dùng placeholder riêng để tránh lỗi định dạng ký tự %.
             */
            String html = """
                    <!DOCTYPE html>
                    <html lang="vi">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport"
                              content="width=device-width, initial-scale=1.0">
                        <title>Xác nhận đặt phòng - GrandStay</title>
                    </head>

                    <body style="margin:0;padding:0;
                        background-color:#f3f4f6;
                        font-family:Arial,Helvetica,sans-serif;
                        color:#263247;">

                        <table role="presentation" width="100%" cellspacing="0"
                               cellpadding="0" border="0"
                               style="background-color:#f3f4f6;padding:24px 10px;">
                            <tr>
                                <td align="center">

                                    <table role="presentation" width="600"
                                           cellspacing="0" cellpadding="0" border="0"
                                           style="width:100%;max-width:600px;">

                                        <!-- HEADER -->
                                        <tr>
                                            <td align="center"
                                                style="background-color:#8750ed;
                                                padding:30px 20px;color:#ffffff;">

                                                <div style="font-size:28px;
                                                    font-weight:bold;
                                                    letter-spacing:1px;">
                                                    GrandStay
                                                </div>

                                                <div style="font-size:18px;
                                                    margin-top:10px;">
                                                    Xác nhận đặt phòng thành công
                                                </div>

                                                <div style="font-size:13px;
                                                    margin-top:5px;opacity:0.95;">
                                                    Booking Confirmation
                                                </div>
                                            </td>
                                        </tr>

                                        <!-- MAIN CONTENT -->
                                        <tr>
                                            <td style="background-color:#ffffff;
                                                padding:28px 20px;
                                                border-radius:0 0 10px 10px;">

                                                <p style="font-size:16px;
                                                    line-height:1.7;margin:0 0 14px;">
                                                    Xin chào
                                                    <strong>__CUSTOMER_NAME__</strong>,
                                                </p>

                                                <p style="font-size:14px;
                                                    line-height:1.8;margin:0 0 4px;">
                                                    Cảm ơn bạn đã đặt phòng tại
                                                    <strong>GrandStay Hotel</strong>!
                                                    Chúng tôi rất vui được đón tiếp bạn.
                                                </p>

                                                <p style="font-size:13px;
                                                    line-height:1.8;color:#64748b;
                                                    margin:0 0 24px;">
                                                    Thank you for booking with
                                                    GrandStay Hotel! We look forward
                                                    to welcoming you.
                                                </p>

                                                <!-- BOOKING DETAILS -->
                                                <table role="presentation" width="100%"
                                                       cellspacing="0" cellpadding="0"
                                                       border="0"
                                                       style="background-color:#f8fafc;
                                                       border-radius:8px;
                                                       padding:16px;margin-bottom:20px;">

                                                    <tr>
                                                        <td colspan="2"
                                                            style="font-size:16px;
                                                            font-weight:bold;
                                                            color:#7c3aed;
                                                            padding-bottom:12px;">
                                                            Thông tin đặt phòng /
                                                            Booking Details
                                                        </td>
                                                    </tr>

                                                    __BOOKING_DETAILS__

                                                    <tr>
                                                        <td style="padding:9px 0;
                                                            color:#64748b;font-size:13px;">
                                                            Ngày nhận phòng / Check-in
                                                        </td>
                                                        <td align="right"
                                                            style="padding:9px 0;
                                                            color:#1e293b;font-size:13px;
                                                            font-weight:bold;">
                                                            __CHECK_IN__
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style="padding:9px 0;
                                                            color:#64748b;font-size:13px;">
                                                            Ngày trả phòng / Check-out
                                                        </td>
                                                        <td align="right"
                                                            style="padding:9px 0;
                                                            color:#1e293b;font-size:13px;
                                                            font-weight:bold;">
                                                            __CHECK_OUT__
                                                        </td>
                                                    </tr>

                                                </table>

                                                <!-- ROOM DETAILS -->
                                                <table role="presentation" width="100%"
                                                       cellspacing="0" cellpadding="0"
                                                       border="0"
                                                       style="background-color:#ffffff;
                                                       border:1px solid #e5e7eb;
                                                       border-radius:8px;
                                                       margin-bottom:20px;">

                                                    <tr>
                                                        <td style="padding:15px 15px 10px;
                                                            color:#7c3aed;
                                                            font-size:15px;
                                                            font-weight:bold;">
                                                            🛏 Chi tiết phòng đã đặt /
                                                            Room Details
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td style="padding:0 15px 15px;">
                                                            <table role="presentation"
                                                                   width="100%"
                                                                   cellspacing="0"
                                                                   cellpadding="0"
                                                                   border="0"
                                                                   style="border:1px solid #e2e8f0;
                                                                   border-radius:7px;">

                                                                <tr>
                                                                    <td style="padding:14px;">
                                                                        <div style="font-size:14px;
                                                                            font-weight:bold;
                                                                            color:#1e293b;">
                                                                            1. __ROOM_NAME__
                                                                        </div>

                                                                        <div style="font-size:13px;
                                                                            color:#64748b;
                                                                            margin-top:7px;">
                                                                            Số phòng / Room number:
                                                                            __ROOM_NUMBER__
                                                                        </div>

                                                                        <div style="font-size:13px;
                                                                            color:#64748b;
                                                                            margin-top:5px;">
                                                                            Số khách / Guests:
                                                                            __GUEST_COUNT__
                                                                        </div>

                                                                        <div style="font-size:13px;
                                                                            color:#64748b;
                                                                            margin-top:5px;">
                                                                            __NIGHTS__ đêm / nights
                                                                        </div>
                                                                    </td>
                                                                </tr>

                                                            </table>
                                                        </td>
                                                    </tr>
                                                </table>

                                                <!-- PAYMENT SUMMARY -->
                                                <table role="presentation" width="100%"
                                                       cellspacing="0" cellpadding="0"
                                                       border="0"
                                                       style="background-color:#f8fafc;
                                                       border-radius:8px;padding:16px;">

                                                    <tr>
                                                        <td colspan="2"
                                                            style="font-size:15px;
                                                            font-weight:bold;
                                                            color:#7c3aed;
                                                            padding-bottom:12px;">
                                                            Chi phí đặt phòng /
                                                            Booking Summary
                                                        </td>
                                                    </tr>

                                                    __PAYMENT_SUMMARY__

                                                </table>

                                                <!-- STATUS -->
                                                <div style="margin-top:20px;
                                                    padding:14px;
                                                    background-color:#f5f3ff;
                                                    border-left:4px solid #8b5cf6;
                                                    border-radius:5px;
                                                    font-size:13px;
                                                    line-height:1.8;">

                                                    <strong>Trạng thái / Status:</strong>

                                                    <span style="color:#7c3aed;
                                                        font-weight:bold;">
                                                        __STATUS__
                                                    </span>

                                                    <br>

                                                    Vui lòng lưu lại mã đặt phòng
                                                    để tra cứu khi cần.

                                                    <br>

                                                    Please keep your booking reference
                                                    for future inquiries.
                                                </div>

                                                <p style="font-size:14px;
                                                    line-height:1.8;margin:24px 0 0;">
                                                    Trân trọng,<br>
                                                    <strong>GrandStay Hotel</strong>
                                                </p>

                                                <p style="font-size:12px;
                                                    line-height:1.7;color:#94a3b8;
                                                    margin:8px 0 0;">
                                                    Đây là email tự động. Vui lòng
                                                    không trả lời trực tiếp email này.
                                                </p>

                                            </td>
                                        </tr>

                                        <!-- FOOTER -->
                                        <tr>
                                            <td align="center"
                                                style="padding:20px 12px;
                                                color:#94a3b8;font-size:12px;
                                                line-height:1.8;">
                                                © 2026 GrandStay Hotel<br>
                                                Hệ thống đặt phòng trực tuyến
                                            </td>
                                        </tr>

                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                    """;

            // Thay placeholder bằng dữ liệu thực tế.
            html = html
                    .replace("__CUSTOMER_NAME__", name)
                    .replace(
                            "__BOOKING_DETAILS__",
                            detailRow(
                                    "Mã đặt phòng / Booking Reference",
                                    bookingCode
                            )
                    )
                    .replace("__CHECK_IN__", checkIn)
                    .replace("__CHECK_OUT__", checkOut)
                    .replace("__ROOM_NAME__", roomName)
                    .replace("__ROOM_NUMBER__", roomNumber)
                    .replace("__GUEST_COUNT__", guestCount)
                    .replace("__NIGHTS__", nights)
                    .replace(
                            "__PAYMENT_SUMMARY__",
                            summaryRows(
                                    totalAmountText,
                                    discountCode,
                                    discountAmountText,
                                    finalAmountText,
                                    depositAmountText,
                                    remainingAmountText
                            )
                    )
                    .replace("__STATUS__", escapeHtml(statusText));

            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    false,
                    "UTF-8"
            );

            helper.setTo(to.trim());

            helper.setSubject(
                    "Đặt phòng thành công / Booking Confirmation #"
                            + booking.getBookingCode()
            );

            helper.setText(html, true);

            mailSender.send(message);

            log.info(
                    "Đã gửi email xác nhận booking {} đến {}",
                    booking.getBookingCode(),
                    to
            );

        } catch (Exception exception) {
            log.error(
                    "Lỗi gửi email xác nhận booking: {}",
                    exception.getMessage(),
                    exception
            );
        }
    }

    /**
     * Tạo một dòng thông tin trong email.
     */
    private String detailRow(String label, String value) {
        return """
                <tr>
                    <td style="padding:9px 0;
                        border-bottom:1px solid #e2e8f0;
                        color:#64748b;font-size:13px;">
                        %s
                    </td>
                    <td align="right"
                        style="padding:9px 0;
                        border-bottom:1px solid #e2e8f0;
                        color:#1e293b;font-size:13px;font-weight:bold;">
                        %s
                    </td>
                </tr>
                """.formatted(
                escapeHtml(label),
                value == null ? "" : value
        );
    }

    /**
     * Tạo bảng tổng kết chi phí, bao gồm tiền cọc và số tiền còn lại.
     */
    private String summaryRows(
            String total,
            String discountCode,
            String discount,
            String finalAmount,
            String depositAmount,
            String remainingAmount
    ) {
        String discountCodeRow = "";

        if (discountCode != null && !discountCode.isBlank()) {
            discountCodeRow = detailRow(
                    "Mã giảm giá / Discount code",
                    discountCode
            );
        }

        return detailRow(
                "Tổng tiền phòng / Subtotal",
                total + " VND"
        )
                + discountCodeRow
                + detailRow(
                "Số tiền giảm giá / Discount",
                "-" + discount + " VND"
        )
                + detailRow(
                "Thành tiền sau giảm / Final total",
                finalAmount + " VND"
        )
                + detailRow(
                "Tiền cọc 30% / Deposit",
                depositAmount + " VND"
        )
                + """
            <tr>
                <td style="padding-top:14px;font-size:14px;
                    font-weight:bold;color:#1e293b;
                    border-top:1px solid #e2e8f0;">
                    Số tiền còn lại / Remaining balance
                </td>
                <td align="right"
                    style="padding-top:14px;font-size:16px;
                    font-weight:bold;color:#dc2626;
                    border-top:1px solid #e2e8f0;">
                    %s VND
                </td>
            </tr>
            """.formatted(escapeHtml(remainingAmount));
    }

    /**
     * Định dạng tiền theo kiểu 1,000,000.
     */
    private String formatMoney(BigDecimal amount) {
        if (amount == null) {
            return "0";
        }

        DecimalFormat formatter = new DecimalFormat(
                "#,##0",
                DecimalFormatSymbols.getInstance(Locale.US)
        );

        return formatter.format(amount);
    }

    /**
     * Escape dữ liệu động trước khi đưa vào HTML.
     */
    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    /**
     * Phương thức gửi email văn bản dùng chung.
     */
    public void sendMail(String to, String subject, String text) {
        if (to == null || to.isBlank()) {
            log.warn("Không thể gửi email vì địa chỉ email trống.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();

            message.setTo(to.trim());
            message.setSubject(subject);
            message.setText(text);

            mailSender.send(message);

            log.info("Đã gửi email thành công đến {}", to);

        } catch (Exception exception) {
            log.error(
                    "Gửi email đến {} thất bại: {}",
                    to,
                    exception.getMessage(),
                    exception
            );
        }
    }
}
