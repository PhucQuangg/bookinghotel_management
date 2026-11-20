
package com.stu.edu.bookinghotel_management.service;

import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;

import com.stu.edu.bookinghotel_management.entity.Booking;
import com.stu.edu.bookinghotel_management.entity.BookingRoom;
import com.stu.edu.bookinghotel_management.entity.BookingExtraCost;
import com.stu.edu.bookinghotel_management.entity.Room;
import com.stu.edu.bookinghotel_management.entity.PaymentStatus;

import com.stu.edu.bookinghotel_management.repository.BookingRepository;
import com.stu.edu.bookinghotel_management.repository.BookingRoomRepository;
import com.stu.edu.bookinghotel_management.repository.BookingExtraCostRepository;
import com.stu.edu.bookinghotel_management.repository.RoomRepository;
import com.stu.edu.bookinghotel_management.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class InvoicePdfService {

    private final BookingRepository bookingRepository;
    private final BookingRoomRepository bookingRoomRepository;
    private final BookingExtraCostRepository extraCostRepository;
    private final RoomRepository roomRepository;
    private final PaymentRepository paymentRepository;

    private static final Color DARK_GREEN =
            new DeviceRgb(24, 59, 50);

    private static final Color LIGHT_GREEN =
            new DeviceRgb(234, 240, 236);

    private static final Color ORANGE =
            new DeviceRgb(196, 123, 32);

    private static final Color GRAY =
            new DeviceRgb(100, 116, 139);

    private static final Color LIGHT_GRAY =
            new DeviceRgb(248, 250, 248);

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Tạo hóa đơn PDF theo ID booking.
     */
    @Transactional(readOnly = true)
    public byte[] generateInvoicePdf(Long bookingId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy booking"));

        List<BookingRoom> bookingRooms =
                bookingRoomRepository.findByBookingId(bookingId);

        List<BookingExtraCost> extraCosts =
                extraCostRepository.findByBooking_Id(bookingId);

        BigDecimal totalAmount =
                zeroIfNull(booking.getTotalAmount());

        BigDecimal discountAmount =
                zeroIfNull(booking.getDiscountAmount());

        BigDecimal finalAmount =
                zeroIfNull(booking.getFinalAmount());

        BigDecimal paidAmount = paymentRepository
                .sumPaidAmountByBookingId(
                        bookingId,
                        PaymentStatus.PAID
                );

        paidAmount = zeroIfNull(paidAmount);

        BigDecimal remainingAmount =
                finalAmount.subtract(paidAmount);

        if (remainingAmount.compareTo(BigDecimal.ZERO) < 0) {
            remainingAmount = BigDecimal.ZERO;
        }

        try (ByteArrayOutputStream outputStream =
                     new ByteArrayOutputStream()) {

            PdfWriter writer = new PdfWriter(outputStream);

            PdfDocument pdfDocument = new PdfDocument(writer);

            Document document = new Document(pdfDocument);

            document.setMargins(35, 40, 35, 40);

            // Font Arial có sẵn trên Windows, không cần resources.
            PdfFont font = loadFont();

            document.setFont(font);

            addHeader(document, font);

            addBookingInformation(
                    document,
                    booking,
                    font
            );

            addServiceTable(
                    document,
                    booking,
                    bookingRooms,
                    extraCosts,
                    font
            );

            addPaymentSummary(
                    document,
                    totalAmount,
                    discountAmount,
                    finalAmount,
                    paidAmount,
                    remainingAmount,
                    font
            );

            addFooter(document, font);

            document.close();

            return outputStream.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException(
                    "Không thể tạo hóa đơn PDF: " + e.getMessage(),
                    e
            );
        }
    }

    /**
     * Load font Arial từ Windows.
     * Không cần thêm font vào resources.
     */
    private PdfFont loadFont() throws Exception {

        String fontPath = "C:/Windows/Fonts/arial.ttf";

        return PdfFontFactory.createFont(
                fontPath,
                PdfEncodings.IDENTITY_H,
                PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED
        );
    }

    /**
     * Header hóa đơn.
     */
    private void addHeader(
            Document document,
            PdfFont font
    ) {

        document.add(
                new Paragraph("GRANDSTAY")
                        .setFont(font)
                        .setFontSize(25)
                        .setBold()
                        .setFontColor(DARK_GREEN)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setMarginBottom(2)
        );

        document.add(
                new Paragraph("HOTEL")
                        .setFont(font)
                        .setFontSize(10)
                        .setFontColor(GRAY)
                        .setCharacterSpacing(2)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setMarginBottom(14)
        );

        document.add(
                new Paragraph("HÓA ĐƠN THANH TOÁN")
                        .setFont(font)
                        .setFontSize(18)
                        .setBold()
                        .setFontColor(DARK_GREEN)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setMarginBottom(3)
        );

        document.add(
                new Paragraph("BOOKING INVOICE")
                        .setFont(font)
                        .setFontSize(9)
                        .setFontColor(GRAY)
                        .setTextAlignment(TextAlignment.CENTER)
        );
    }

    /**
     * Thông tin booking và khách hàng.
     */
    private void addBookingInformation(
            Document document,
            Booking booking,
            PdfFont font
    ) {

        addSectionTitle(
                document,
                "THÔNG TIN ĐẶT PHÒNG",
                font
        );

        Table table = new Table(
                UnitValue.createPercentArray(
                        new float[]{1, 1}
                )
        ).useAllAvailableWidth();

        table.addCell(infoCell(
                "Mã đặt phòng",
                booking.getBookingCode(),
                font
        ));

        table.addCell(infoCell(
                "Khách hàng",
                booking.getCustomer().getFullName(),
                font
        ));

        table.addCell(infoCell(
                "Số điện thoại",
                booking.getCustomer().getPhone(),
                font
        ));

        table.addCell(infoCell(
                "Email",
                booking.getCustomer().getEmail(),
                font
        ));

        table.addCell(infoCell(
                "Ngày nhận phòng",
                formatDate(booking.getCheckInDate()),
                font
        ));

        table.addCell(infoCell(
                "Ngày trả phòng",
                formatDate(booking.getCheckOutDate()),
                font
        ));

        document.add(table);
    }

    /**
     * Bảng chi tiết phòng và chi phí phát sinh.
     */
    private void addServiceTable(
            Document document,
            Booking booking,
            List<BookingRoom> bookingRooms,
            List<BookingExtraCost> extraCosts,
            PdfFont font
    ) {

        addSectionTitle(
                document,
                "CHI TIẾT DỊCH VỤ",
                font
        );

        Table table = new Table(
                UnitValue.createPercentArray(
                        new float[]{0.7f, 2.3f, 1.1f, 1.3f, 1.5f}
                )
        ).useAllAvailableWidth();

        addHeaderCell(table, "STT", font);
        addHeaderCell(table, "Nội dung", font);
        addHeaderCell(table, "Số lượng", font);
        addHeaderCell(table, "Đơn giá", font);
        addHeaderCell(table, "Thành tiền", font);

        int index = 1;

        // Chi tiết từng phòng.
        if (bookingRooms != null) {

            for (BookingRoom bookingRoom : bookingRooms) {

                Room room = roomRepository
                        .findById(bookingRoom.getRoomId())
                        .orElse(null);

                String roomName = "Phòng đã đặt";
                String roomNumber = "";

                if (room != null) {

                    if (room.getRoomType() != null) {
                        roomName = room.getRoomType().getName();
                    }

                    roomNumber = room.getRoomNumber();
                }

                LocalDate checkIn =
                        bookingRoom.getCheckInDate() != null
                                ? bookingRoom.getCheckInDate()
                                : booking.getCheckInDate();

                LocalDate checkOut =
                        bookingRoom.getCheckOutDate() != null
                                ? bookingRoom.getCheckOutDate()
                                : booking.getCheckOutDate();

                long nights = ChronoUnit.DAYS.between(
                        checkIn,
                        checkOut
                );

                if (nights < 1) {
                    nights = 1;
                }

                BigDecimal roomPrice =
                        zeroIfNull(bookingRoom.getRoomPrice());

                BigDecimal roomDiscount =
                        zeroIfNull(bookingRoom.getDiscountAmount());

                BigDecimal roomTotal = roomPrice
                        .multiply(BigDecimal.valueOf(nights))
                        .subtract(roomDiscount);

                if (roomTotal.compareTo(BigDecimal.ZERO) < 0) {
                    roomTotal = BigDecimal.ZERO;
                }

                String description = roomName;

                if (roomNumber != null && !roomNumber.isBlank()) {
                    description += " - Phòng " + roomNumber;
                }

                description += " (" + nights + " đêm)";

                addBodyCell(table, String.valueOf(index++), font);
                addBodyCell(table, description, font);
                addBodyCell(table, "1 phòng", font);
                addBodyCell(table, formatMoney(roomPrice), font);
                addBodyCell(table, formatMoney(roomTotal), font);
            }
        }

        // Chi phí phát sinh.
        if (extraCosts != null) {

            for (BookingExtraCost extra : extraCosts) {

                BigDecimal unitPrice =
                        zeroIfNull(extra.getUnitPrice());

                BigDecimal amount =
                        zeroIfNull(extra.getTotalAmount());

                Integer quantity = extra.getQuantity() == null
                        ? 1
                        : extra.getQuantity();

                String description = extra.getName();

                if (extra.getIncurredDate() != null) {
                    description += " - "
                            + formatDate(extra.getIncurredDate());
                }

                addBodyCell(table, String.valueOf(index++), font);
                addBodyCell(table, description, font);
                addBodyCell(table, String.valueOf(quantity), font);
                addBodyCell(table, formatMoney(unitPrice), font);
                addBodyCell(table, formatMoney(amount), font);
            }
        }

        document.add(table);
    }

    /**
     * Tổng kết thanh toán.
     */
    private void addPaymentSummary(
            Document document,
            BigDecimal totalAmount,
            BigDecimal discountAmount,
            BigDecimal finalAmount,
            BigDecimal paidAmount,
            BigDecimal remainingAmount,
            PdfFont font
    ) {

        addSectionTitle(
                document,
                "TỔNG KẾT THANH TOÁN",
                font
        );

        Table table = new Table(
                UnitValue.createPercentArray(
                        new float[]{1.2f, 1}
                )
        ).useAllAvailableWidth();

        addSummaryRow(
                table,
                "Tổng tiền dịch vụ",
                totalAmount,
                font
        );

        addSummaryRow(
                table,
                "Tổng giảm giá",
                discountAmount.negate(),
                font
        );

        addSummaryRow(
                table,
                "Tổng thanh toán",
                finalAmount,
                font
        );

        addSummaryRow(
                table,
                "Đã thanh toán",
                paidAmount,
                font
        );

        Cell remainingLabel = new Cell()
                .add(
                        new Paragraph("CÒN PHẢI THANH TOÁN")
                                .setFont(font)
                                .setBold()
                                .setFontSize(10)
                )
                .setBorder(Border.NO_BORDER)
                .setPadding(8);

        Cell remainingValue = new Cell()
                .add(
                        new Paragraph(
                                formatMoney(remainingAmount) + " VNĐ"
                        )
                                .setFont(font)
                                .setBold()
                                .setFontSize(12)
                                .setFontColor(ORANGE)
                                .setTextAlignment(TextAlignment.RIGHT)
                )
                .setBorder(Border.NO_BORDER)
                .setPadding(8);

        table.addCell(remainingLabel);
        table.addCell(remainingValue);

        document.add(table);
    }

    /**
     * Footer hóa đơn.
     */
    private void addFooter(
            Document document,
            PdfFont font
    ) {

        document.add(
                new Paragraph("GRANDSTAY HOTEL ")
                        .setFont(font)
                        .setBold()
                        .setFontSize(12)
                        .setFontColor(DARK_GREEN)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setMarginTop(25)
        );

        document.add(
                new Paragraph(
                        "Cảm ơn Quý khách đã tin tưởng và lựa chọn dịch vụ của chúng tôi!"
                )
                        .setFont(font)
                        .setFontSize(9)
                        .setFontColor(GRAY)
                        .setTextAlignment(TextAlignment.CENTER)
        );

        document.add(
                new Paragraph(
                        "Thank you for choosing GRANDSTAY Hotel."
                )
                        .setFont(font)
                        .setFontSize(8)
                        .setFontColor(GRAY)
                        .setTextAlignment(TextAlignment.CENTER)
        );
    }

    private void addSectionTitle(
            Document document,
            String title,
            PdfFont font
    ) {

        document.add(
                new Paragraph(title)
                        .setFont(font)
                        .setBold()
                        .setFontSize(11)
                        .setFontColor(DARK_GREEN)
                        .setMarginTop(14)
                        .setMarginBottom(8)
        );
    }

    private Cell infoCell(
            String label,
            String value,
            PdfFont font
    ) {

        return new Cell()
                .add(
                        new Paragraph(label)
                                .setFont(font)
                                .setFontSize(8)
                                .setFontColor(GRAY)
                )
                .add(
                        new Paragraph(value == null ? "" : value)
                                .setFont(font)
                                .setFontSize(9)
                                .setBold()
                                .setFontColor(DARK_GREEN)
                )
                .setBorder(Border.NO_BORDER)
                .setPadding(7);
    }

    private void addHeaderCell(
            Table table,
            String value,
            PdfFont font
    ) {

        table.addHeaderCell(
                new Cell()
                        .add(
                                new Paragraph(value)
                                        .setFont(font)
                                        .setBold()
                                        .setFontSize(8)
                                        .setFontColor(DARK_GREEN)
                                        .setTextAlignment(
                                                TextAlignment.CENTER
                                        )
                        )
                        .setBackgroundColor(LIGHT_GREEN)
                        .setPadding(8)
        );
    }

    private void addBodyCell(
            Table table,
            String value,
            PdfFont font
    ) {

        table.addCell(
                new Cell()
                        .add(
                                new Paragraph(
                                        value == null ? "" : value
                                )
                                        .setFont(font)
                                        .setFontSize(8)
                        )
                        .setPadding(7)
        );
    }

    private void addSummaryRow(
            Table table,
            String label,
            BigDecimal amount,
            PdfFont font
    ) {

        table.addCell(
                new Cell()
                        .add(
                                new Paragraph(label)
                                        .setFont(font)
                                        .setFontSize(9)
                        )
                        .setBorder(Border.NO_BORDER)
                        .setPadding(7)
        );

        table.addCell(
                new Cell()
                        .add(
                                new Paragraph(
                                        formatMoney(amount) + " VNĐ"
                                )
                                        .setFont(font)
                                        .setFontSize(9)
                                        .setTextAlignment(
                                                TextAlignment.RIGHT
                                        )
                        )
                        .setBorder(Border.NO_BORDER)
                        .setPadding(7)
        );
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String formatMoney(BigDecimal amount) {

        DecimalFormat formatter = new DecimalFormat(
                "#,##0",
                DecimalFormatSymbols.getInstance(Locale.US)
        );

        return formatter.format(zeroIfNull(amount));
    }

    private String formatDate(LocalDate date) {
        return date == null
                ? ""
                : date.format(DATE_FORMAT);
    }
}
