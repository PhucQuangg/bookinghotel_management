import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/BookingConfirm.css";

const API_URL = "http://localhost:8080/api";

const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN").format(Number(price) || 0) + "đ";

const formatDate = (date) => {
    if (!date) return "Chưa chọn";
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
};

function BookingConfirm() {
    const location = useLocation();
    const navigate = useNavigate();

    const state = location.state;
    const room = state?.room;
    const checkIn = state?.checkIn;
    const checkOut = state?.checkOut;
    const guests = Number(state?.guests) || 1;

    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Trạng thái mã giảm giá
    const [discountInput, setDiscountInput] = useState("");
    const [discountResult, setDiscountResult] = useState(null);
    const [discountError, setDiscountError] = useState("");
    const [applyingDiscount, setApplyingDiscount] = useState(false);

    const roomId = room?.roomId ?? room?.id;

    const roomName =
        room?.roomTypeName ||
        room?.roomType?.name ||
        room?.name ||
        "Phòng nghỉ";

    const roomNumber = room?.roomNumber || "Chưa cập nhật";

    const roomPrice = Number(
        room?.basePrice ??
        room?.roomType?.basePrice ??
        room?.price ??
        0
    );

    const nights =
        checkIn && checkOut
            ? Math.round(
                (new Date(`${checkOut}T00:00:00`) -
                    new Date(`${checkIn}T00:00:00`)) /
                (1000 * 60 * 60 * 24)
            )
            : 0;

    const totalAmount = roomPrice * Math.max(nights, 0);
    const discountAmount = discountResult
        ? Number(discountResult.discountAmount) || 0
        : 0;
    const finalAmount = discountResult
        ? Number(discountResult.finalAmount)
        : totalAmount;
    const depositAmount = Math.round((Number(finalAmount) || 0) * 0.3);

    const handleApplyDiscount = async () => {
        if (applyingDiscount || loading) return;

        setDiscountError("");
        setError("");

        const code = discountInput.trim().toUpperCase();

        if (!code) {
            setDiscountResult(null);
            setDiscountError("Vui lòng nhập mã giảm giá.");
            return;
        }

        if (!roomId || !checkIn || !checkOut || nights <= 0) {
            setDiscountResult(null);
            setDiscountError("Thông tin phòng hoặc ngày đặt phòng không hợp lệ.");
            return;
        }

        try {
            setApplyingDiscount(true);

            const token = sessionStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
                Accept: "application/json",
            };

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch(
                `${API_URL}/discount-codes/validate`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        roomId: Number(roomId),
                        checkInDate: checkIn,
                        checkOutDate: checkOut,
                        discountCode: code,
                    }),
                }
            );

            const responseText = await response.text();
            let data = {};

            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch {
                data = { message: responseText };
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "Mã giảm giá không hợp lệ hoặc đã hết hạn."
                );
            }

            if (data.finalAmount == null || data.discountAmount == null) {
                throw new Error(
                    data.message ||
                    "Máy chủ không trả về thông tin giảm giá đầy đủ."
                );
            }

            setDiscountResult({
                ...data,
                code: data.code || code,
            });
            setDiscountInput(data.code || code);
            setDiscountError("");
        } catch (err) {
            setDiscountResult(null);
            setDiscountError(
                err.message || "Không thể kiểm tra mã giảm giá."
            );
        } finally {
            setApplyingDiscount(false);
        }
    };

    const handleRemoveDiscount = () => {
        setDiscountInput("");
        setDiscountResult(null);
        setDiscountError("");
    };

    const handleSubmit = async () => {
        if (loading) return;

        setError("");

        const token = sessionStorage.getItem("token");

        if (!token) {
            navigate("/login", {
                state: {
                    from: "/booking-confirm",
                    bookingState: state,
                },
            });
            return;
        }

        if (!roomId) {
            setError(
                "Không tìm thấy thông tin phòng. Vui lòng chọn phòng lại."
            );
            return;
        }

        if (!checkIn || !checkOut || nights <= 0) {
            setError(
                "Thông tin ngày nhận hoặc trả phòng không hợp lệ."
            );
            return;
        }

        if (!Number.isInteger(guests) || guests < 1) {
            setError("Số lượng khách không hợp lệ.");
            return;
        }

        try {
            setLoading(true);

            // Backend phải tính lại mã giảm giá khi tạo giao dịch,
            // không tin số tiền giảm giá do frontend tự tính.
            const response = await fetch(
                `${API_URL}/payments/checkout`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        roomId: Number(roomId),
                        checkInDate: checkIn,
                        checkOutDate: checkOut,
                        guestCount: guests,
                        note: note.trim(),
                        paymentMethod: "VNPAY",
                        discountCode: discountResult?.code || null,
                    }),
                }
            );

            const responseText = await response.text();
            let data = {};

            try {
                data = responseText ? JSON.parse(responseText) : {};
            } catch {
                data = { message: responseText };
            }

            if (!response.ok) {
                if (response.status === 401) {
                    sessionStorage.removeItem("token");
                    navigate("/login", {
                        state: {
                            from: "/booking-confirm",
                            bookingState: state,
                        },
                    });
                    return;
                }

                throw new Error(
                    data.message ||
                    data.error ||
                    `Không thể tạo giao dịch thanh toán (HTTP ${response.status}).`
                );
            }

            if (!data.paymentUrl) {
                throw new Error(
                    "Backend không trả về đường dẫn thanh toán VNPay."
                );
            }

            // Chuyển sang VNPay; Booking chỉ được tạo sau khi backend
            // xác minh thanh toán thành công.
            window.location.assign(data.paymentUrl);
        } catch (err) {
            setError(
                err.message || "Không thể kết nối đến máy chủ."
            );
        } finally {
            setLoading(false);
        }
    };

    if (!room) {
        return (
            <div className="booking-confirm-page">
                <div className="booking-confirm-empty">
                    <h2>Không tìm thấy thông tin phòng</h2>
                    <p>Vui lòng quay lại và chọn phòng muốn đặt.</p>
                    <button onClick={() => navigate("/")}>
                        Quay lại trang chủ
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="booking-confirm-page">
            <div className="booking-confirm-container">
                <button
                    className="booking-back-btn"
                    onClick={() => navigate(-1)}
                    disabled={loading || applyingDiscount}
                >
                    ← Quay lại
                </button>

                <div className="booking-confirm-heading">
                    <h1>Xác nhận đặt phòng</h1>
                    <p>
                        Vui lòng kiểm tra thông tin trước khi xác nhận.
                    </p>
                </div>

                <div className="booking-confirm-grid">
                    <section className="booking-confirm-card">
                        <h2>Thông tin phòng</h2>

                        <div className="booking-room-info">
                            {room.image || room.imageUrl ? (
                                <img
                                    src={room.image || room.imageUrl}
                                    alt={roomName}
                                    className="booking-room-image"
                                />
                            ) : (
                                <div className="booking-room-placeholder">
                                    GRANDSTAY
                                </div>
                            )}

                            <div>
                                <h3>{roomName}</h3>
                                <p>Phòng số: {roomNumber}</p>
                                <p>
                                    Sức chứa:{" "}
                                    {room.capacity ||
                                        room.roomTypeCapacity ||
                                        room.roomType?.capacity ||
                                        "Theo quy định phòng"}{" "}
                                    khách
                                </p>
                                <strong>
                                    {formatPrice(roomPrice)} / đêm
                                </strong>
                            </div>
                        </div>

                        <div className="booking-info-row">
                            <span>Ngày nhận phòng</span>
                            <strong>{formatDate(checkIn)}</strong>
                        </div>

                        <div className="booking-info-row">
                            <span>Ngày trả phòng</span>
                            <strong>{formatDate(checkOut)}</strong>
                        </div>

                        <div className="booking-info-row">
                            <span>Số đêm</span>
                            <strong>
                                {nights > 0 ? nights : 0} đêm
                            </strong>
                        </div>

                        <div className="booking-info-row">
                            <span>Số lượng khách</span>
                            <strong>{guests} khách</strong>
                        </div>

                        <label
                            className="booking-note-label"
                            htmlFor="booking-note"
                        >
                            Ghi chú cho khách sạn (không bắt buộc)
                        </label>

                        <textarea
                            id="booking-note"
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            placeholder="Ví dụ: Tôi muốn nhận phòng muộn..."
                            rows={4}
                            maxLength={1000}
                            disabled={loading}
                        />
                    </section>

                    <aside className="booking-confirm-card booking-price-card">
                        <h2>Chi phí đặt phòng</h2>

                        <div className="booking-info-row">
                            <span>
                                {formatPrice(roomPrice)} × {nights} đêm
                            </span>
                            <strong>{formatPrice(totalAmount)}</strong>
                        </div>

                        <div className="booking-discount-section">
                            <label htmlFor="discount-code">
                                Mã giảm giá
                            </label>

                            <div className="booking-discount-controls">
                                <input
                                    id="discount-code"
                                    type="text"
                                    value={discountInput}
                                    onChange={(event) => {
                                        setDiscountInput(
                                            event.target.value.toUpperCase()
                                        );
                                        setDiscountResult(null);
                                        setDiscountError("");
                                    }}
                                    placeholder="Nhập mã giảm giá"
                                    maxLength={50}
                                    disabled={loading || applyingDiscount}
                                />

                                {discountResult ? (
                                    <button
                                        type="button"
                                        onClick={handleRemoveDiscount}
                                        disabled={loading || applyingDiscount}
                                    >
                                        Bỏ mã
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleApplyDiscount}
                                        disabled={loading || applyingDiscount}
                                    >
                                        {applyingDiscount
                                            ? "Đang kiểm tra..."
                                            : "Áp dụng"}
                                    </button>
                                )}
                            </div>

                            {discountResult && (
                                <p className="booking-discount-success">
                                    Đã áp dụng mã {discountResult.code} thành công.
                                </p>
                            )}

                            {discountError && (
                                <p
                                    className="booking-discount-error"
                                    role="alert"
                                >
                                    {discountError}
                                </p>
                            )}
                        </div>

                        <div className="booking-info-row">
                            <span>Giảm giá</span>
                            <strong>
                                {discountAmount > 0
                                    ? `-${formatPrice(discountAmount)}`
                                    : formatPrice(0)}
                            </strong>
                        </div>

                        <div className="booking-price-total">
                            <span>Tổng tiền sau giảm giá</span>
                            <strong>{formatPrice(finalAmount)}</strong>
                        </div>

                        <div className="booking-info-row">
                            <span>Tiền cọc dự kiến (30%)</span>
                            <strong>{formatPrice(depositAmount)}</strong>
                        </div>

                        <p className="booking-price-note">
                            Tiền cọc dự kiến bằng 30% tổng tiền sau giảm giá.
                            Số tiền chính thức được backend tính toán lại
                            trước khi tạo giao dịch VNPay.
                        </p>

                        {error && (
                            <div className="booking-error" role="alert">
                                {error}
                            </div>
                        )}

                        <button
                            className="booking-primary-btn booking-submit-btn"
                            onClick={handleSubmit}
                            disabled={loading || applyingDiscount}
                        >
                            {loading
                                ? "Đang xử lý..."
                                : "Thanh toán tiền cọc qua VNPay"}
                        </button>

                        <p className="booking-terms">
                            Đơn đặt phòng chỉ được tạo sau khi hệ thống
                            xác minh thanh toán VNPay thành công.
                        </p>
                    </aside>
                </div>
            </div>
        </div>
    );
}

export default BookingConfirm;
