import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/RoomSelection.css";

const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN").format(price || 0) + "đ";

const formatDate = (date) => {
    if (!date) return "Chưa chọn";

    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
};

function RoomSelection() {
    const { state } = useLocation();
    const navigate = useNavigate();

    const room = state?.room;

    // Có thể nhận ngày từ trang chủ hoặc để trống nếu khách chưa chọn
    const [checkIn, setCheckIn] = useState(state?.checkIn || "");
    const [checkOut, setCheckOut] = useState(state?.checkOut || "");
    const [guests, setGuests] = useState(
        Number(state?.guests) || 2
    );
    const [error, setError] = useState("");

    const today = new Date().toLocaleDateString("en-CA");

    if (!room) {
        return (
            <div className="room-detail-page">
                <div className="room-detail-empty">
                    <div className="room-empty-icon">⌂</div>
                    <h2>Chưa có thông tin phòng</h2>
                    <p>
                        Vui lòng quay lại trang chủ để chọn
                        phòng phù hợp với kỳ nghỉ của bạn.
                    </p>
                    <button
                        className="room-primary-btn"
                        onClick={() => navigate("/")}
                    >
                        Quay lại trang chủ
                    </button>
                </div>
            </div>
        );
    }

    const checkInTime = checkIn
        ? new Date(`${checkIn}T00:00:00`)
        : null;

    const checkOutTime = checkOut
        ? new Date(`${checkOut}T00:00:00`)
        : null;

    const nights =
        checkInTime && checkOutTime
            ? Math.round(
                  (checkOutTime - checkInTime) /
                      (1000 * 60 * 60 * 24)
              )
            : 0;

    const roomName =
        room.roomTypeName || room.name || "Phòng nghỉ";

    const roomDescription =
        room.roomTypeDescription ||
        room.description ||
        "Không gian nghỉ dưỡng thoải mái, mang đến trải nghiệm thư giãn cho bạn.";

    const roomPrice = Number(room.basePrice ?? room.price ?? 0);

    const estimatedTotal =
        nights > 0 ? nights * roomPrice : 0;

    const roomImage =
        room.image ||
        room.imageUrl ||
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=85";

    const handleCheckInChange = (value) => {
        setCheckIn(value);
        setError("");

        // Nếu ngày nhận phòng mới không còn trước ngày trả phòng,
        // yêu cầu khách chọn lại ngày trả phòng.
        if (checkOut && value >= checkOut) {
            setCheckOut("");
        }
    };

    const handleCheckOutChange = (value) => {
        setCheckOut(value);
        setError("");
    };

    const handleContinueBooking = () => {
        if (!checkIn || !checkOut) {
            setError("Vui lòng chọn ngày nhận phòng và trả phòng.");
            return;
        }

        if (checkIn < today) {
            setError("Ngày nhận phòng không được ở trong quá khứ.");
            return;
        }

        if (checkOut <= checkIn) {
            setError("Ngày trả phòng phải sau ngày nhận phòng.");
            return;
        }

        if (guests < 1) {
            setError("Số lượng khách không hợp lệ.");
            return;
        }

        setError("");

        navigate("/booking-confirm", {
            state: {
                room: room,
                checkIn: checkIn,
                checkOut: checkOut,
                guests: guests
            }
        });
    };

    return (
        <div className="room-detail-page">
            {/* HEADER */}
            <header className="room-detail-header">
                <div className="room-detail-header-inner">
                    <button
                        className="room-detail-brand"
                        onClick={() => navigate("/")}
                    >
                        <span className="room-brand-symbol">◆</span>
                        <span className="room-brand-text">
                            GRANDSTAY
                            <small>HOTEL & RESORT</small>
                        </span>
                    </button>

                    <button
                        className="room-header-back"
                        onClick={() => navigate("/")}
                    >
                        ← <span>Trang chủ</span>
                    </button>
                </div>
            </header>

            <main className="room-detail-main">
                {/* BREADCRUMB */}
                <div className="room-breadcrumb">
                    <button onClick={() => navigate("/")}>
                        Trang chủ
                    </button>
                    <span>/</span>
                    <a href="/#rooms">Phòng nghỉ</a>
                    <span>/</span>
                    <strong>{roomName}</strong>
                </div>

                {/* TITLE */}
                <section className="room-detail-heading">
                    <div>
                        <span className="room-detail-eyebrow">
                            GRANDSTAY ACCOMMODATION
                        </span>
                        <h1>{roomName}</h1>
                        <p>
                            Khám phá không gian nghỉ dưỡng dành riêng
                            cho kỳ nghỉ của bạn.
                        </p>
                    </div>

                    <div className="room-detail-price-heading">
                        <span>Giá từ</span>
                        <strong>{formatPrice(roomPrice)}</strong>
                        <small>/ đêm</small>
                    </div>
                </section>

                {/* ROOM IMAGE + INFORMATION */}
                <section className="room-detail-layout">
                    <div className="room-detail-left">
                        <div className="room-detail-image-wrap">
                            <img
                                className="room-detail-image"
                                src={roomImage}
                                alt={roomName}
                            />
                            <span className="room-image-label">
                                GRANDSTAY HOTEL
                            </span>
                        </div>

                        <div className="room-description-card">
                            <div className="room-card-title">
                                <span className="room-title-line" />
                                <h2>Về căn phòng</h2>
                            </div>

                            <p>{roomDescription}</p>

                            <div className="room-amenities-grid">
                                <div className="room-amenity">
                                    <span className="room-amenity-icon">♙</span>
                                    <div>
                                        <small>Sức chứa</small>
                                        <strong>
                                            {room.capacity ?? "—"} khách
                                        </strong>
                                    </div>
                                </div>

                                <div className="room-amenity">
                                    <span className="room-amenity-icon">⌂</span>
                                    <div>
                                        <small>Diện tích</small>
                                        <strong>
                                            {room.area ?? "—"} m²
                                        </strong>
                                    </div>
                                </div>

                                <div className="room-amenity">
                                    <span className="room-amenity-icon">▤</span>
                                    <div>
                                        <small>Loại giường</small>
                                        <strong>
                                            {room.bedType || room.bed || "—"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="room-amenity">
                                    <span className="room-amenity-icon">▣</span>
                                    <div>
                                        <small>Số phòng</small>
                                        <strong>
                                            {room.roomNumber || "Theo xác nhận"}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BOOKING SUMMARY */}
                    <aside className="room-booking-card">
                        <div className="room-booking-card-heading">
                            <span className="room-booking-kicker">
                                YOUR STAY
                            </span>
                            <h2>Thông tin lưu trú</h2>
                            <p>
                                {checkIn && checkOut
                                    ? "Kiểm tra thông tin kỳ nghỉ của bạn."
                                    : "Chọn thời gian lưu trú để xem chi phí dự kiến."}
                            </p>
                        </div>

                        {/* DATE PICKERS */}
                        <div className="room-date-picker-group">
                            <label htmlFor="room-checkin">
                                Ngày nhận phòng
                            </label>
                            <input
                                id="room-checkin"
                                type="date"
                                min={today}
                                value={checkIn}
                                onChange={(e) =>
                                    handleCheckInChange(e.target.value)
                                }
                            />

                            <label htmlFor="room-checkout">
                                Ngày trả phòng
                            </label>
                            <input
                                id="room-checkout"
                                type="date"
                                min={checkIn || today}
                                value={checkOut}
                                onChange={(e) =>
                                    handleCheckOutChange(e.target.value)
                                }
                            />

                            <label htmlFor="room-guests">
                                Số lượng khách
                            </label>
                            <select
                                id="room-guests"
                                value={guests}
                                onChange={(e) => {
                                    setGuests(Number(e.target.value));
                                    setError("");
                                }}
                            >
                                {Array.from(
                                    {
                                        length: Math.min(
                                            Number(room.capacity) || 6,
                                            6
                                        ),
                                    },
                                    (_, index) => index + 1
                                ).map((number) => (
                                    <option key={number} value={number}>
                                        {number} khách
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="room-stay-dates">
                            <div className="room-stay-date">
                                <span>NHẬN PHÒNG</span>
                                <strong>{formatDate(checkIn)}</strong>
                                <small>Check-in</small>
                            </div>

                            <div className="room-stay-arrow">→</div>

                            <div className="room-stay-date">
                                <span>TRẢ PHÒNG</span>
                                <strong>{formatDate(checkOut)}</strong>
                                <small>Check-out</small>
                            </div>
                        </div>

                        <div className="room-stay-summary">
                            <div>
                                <span className="room-summary-icon">◷</span>
                                <span>Thời gian lưu trú</span>
                            </div>
                            <strong>
                                {nights > 0 ? `${nights} đêm` : "Chưa chọn"}
                            </strong>
                        </div>

                        <div className="room-stay-summary">
                            <div>
                                <span className="room-summary-icon">♙</span>
                                <span>Số lượng khách</span>
                            </div>
                            <strong>{guests} khách</strong>
                        </div>

                        <div className="room-stay-summary">
                            <div>
                                <span className="room-summary-icon">⌂</span>
                                <span>Loại phòng</span>
                            </div>
                            <strong>{roomName}</strong>
                        </div>

                        <div className="room-booking-divider" />

                        <div className="room-price-row">
                            <span>Giá phòng / đêm</span>
                            <strong>{formatPrice(roomPrice)}</strong>
                        </div>

                        <div className="room-price-row">
                            <span>Số đêm</span>
                            <strong>{nights > 0 ? nights : "—"}</strong>
                        </div>

                        <div className="room-total-price">
                            <div>
                                <span>Tạm tính</span>
                                <small>
                                    {nights > 0
                                        ? "Chưa bao gồm ưu đãi nếu có"
                                        : "Chọn ngày để tính tổng tiền"}
                                </small>
                            </div>
                            <strong>{formatPrice(estimatedTotal)}</strong>
                        </div>

                        {error && (
                            <p className="room-booking-error" role="alert">
                                {error}
                            </p>
                        )}

                        <button
                            className="room-primary-btn room-continue-btn"
                            onClick={handleContinueBooking}
                        >
                            Tiếp tục đặt phòng
                            <span>→</span>
                        </button>

                        <div className="room-booking-note">
                            <span>✓</span>
                            <p>
                                Giá tiền hiển thị là giá dự kiến.
                                Tình trạng phòng cần được xác nhận
                                trước khi hoàn tất đặt phòng.
                            </p>
                        </div>
                    </aside>
                </section>

                {/* BOTTOM NOTE */}
                <section className="room-detail-support">
                    <span className="room-support-icon">✦</span>
                    <div>
                        <strong>Một kỳ nghỉ thoải mái bắt đầu từ đây</strong>
                        <p>
                            Lựa chọn ngày lưu trú phù hợp và tiếp tục
                            để hoàn tất thông tin đặt phòng.
                        </p>
                    </div>
                    <button onClick={() => navigate("/")}>
                        Chọn phòng khác →
                    </button>
                </section>
            </main>

            <footer className="room-detail-footer">
                <span>GRANDSTAY HOTEL & RESORT</span>
                <span>© 2026 GrandStay. All rights reserved.</span>
            </footer>
        </div>
    );
}

export default RoomSelection;