
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../css/BookingDetail.css";

const API_URL = "http://localhost:8080/api/customers/bookings";

const STATUS_INFO = {
  PENDING: { label: "Chờ xác nhận", className: "pending" },
  CONFIRMED: { label: "Đã xác nhận", className: "confirmed" },
  CHECKED_IN: { label: "Đang lưu trú", className: "checked-in" },
  COMPLETED: { label: "Đã hoàn thành", className: "completed" },
  CANCELED: { label: "Đã hủy", className: "canceled" },
};

function formatDate(date) {
  if (!date) return "—";

  const parts = date.split("-");
  return parts.length === 3
    ? `${parts[2]}/${parts[1]}/${parts[0]}`
    : date;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0));
}

function formatArea(area) {
  if (area == null) return "Chưa cập nhật";
  return `${Number(area).toLocaleString("vi-VN")} m²`;
}

function formatFloor(floor) {
  return floor == null ? "Chưa cập nhật" : `Tầng ${floor}`;
}

function formatDateTime(dateTime) {
  if (!dateTime) return "—";

  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) return dateTime;

  return date.toLocaleString("vi-VN");
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Tính tiền cọc 30% và số tiền còn lại.
function calculateDeposit(finalAmount) {
  const amount = Number(finalAmount ?? 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return Math.round(amount * 0.3);
}

function calculateRemaining(finalAmount, depositAmount) {
  return Math.max(
    0,
    Number(finalAmount ?? 0) - depositAmount
  );
}

export default function BookingDetail() {
  const { id } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("token");

      if (!token) {
        setError("Vui lòng đăng nhập để xem chi tiết đặt phòng.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (response.status === 401) {
          throw new Error(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          );
        }

        if (response.status === 403) {
          throw new Error("Bạn không có quyền xem thông tin này.");
        }

        if (response.status === 404) {
          throw new Error("Không tìm thấy đặt phòng này.");
        }

        if (!response.ok) {
          throw new Error("Không thể tải chi tiết đặt phòng.");
        }

        const data = await response.json();
        setBooking(data);
      } catch (err) {
        setError(err.message || "Đã xảy ra lỗi.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleCancelBooking = async () => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      setCancelError("Vui lòng đăng nhập để hủy đặt phòng.");
      setShowCancelModal(false);
      return;
    }

    setCanceling(true);
    setCancelMessage("");
    setCancelError("");

    try {
      const response = await fetch(`${API_URL}/${id}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Không thể hủy đặt phòng."
        );
      }

      setBooking((previous) => ({
        ...previous,
        status: "CANCELED",
      }));

      setCancelMessage("Đặt phòng đã được hủy thành công.");
      setShowCancelModal(false);
    } catch (err) {
      setCancelError(
        err.message || "Đã xảy ra lỗi khi hủy đặt phòng."
      );
      setShowCancelModal(false);
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="booking-detail-state">
        <div className="booking-detail-spinner" />
        <p>Đang tải chi tiết đặt phòng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="booking-detail-state">
        <h2>Không thể hiển thị đặt phòng</h2>
        <p>{error}</p>

        <Link to="/booking-history" className="booking-detail-back">
          Quay lại lịch sử
        </Link>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="booking-detail-state">
        <h2>Không tìm thấy thông tin đặt phòng</h2>

        <Link to="/booking-history" className="booking-detail-back">
          Quay lại lịch sử
        </Link>
      </div>
    );
  }

  const status = STATUS_INFO[booking.status] || {
    label: booking.status || "Không xác định",
    className: "unknown",
  };

  const rooms = booking.rooms || [];

  const canCancel =
    ["PENDING", "CONFIRMED"].includes(booking.status) &&
    booking.checkInDate > getTodayString();

  // Tiền cọc dự kiến 30% và số tiền còn lại 70%.
  const depositAmount = calculateDeposit(booking.finalAmount);

  const remainingAmount = calculateRemaining(
    booking.finalAmount,
    depositAmount
  );
  const discountCode = booking.discountCode || null;

  const totalAmount = Number(booking.totalAmount ?? 0);
  const discountAmount = Number(booking.discountAmount ?? 0);
  const finalAmount = Number(
    booking.finalAmount ?? totalAmount - discountAmount
  );

  return (
    <main className="booking-detail-page">
      <div className="booking-detail-container">
        <Link
          to="/booking-history"
          className="booking-detail-back-link"
        >
          ← Quay lại lịch sử đặt phòng
        </Link>

        <header className="booking-detail-heading">
          <p>GRANDSTAY HOTEL</p>
          <h1>Chi tiết đặt phòng</h1>
          <span>Thông tin đặt phòng của bạn</span>
        </header>

        <section className="booking-detail-card">
          <div className="booking-detail-top">
            <div>
              <span className="booking-detail-label">MÃ ĐẶT PHÒNG</span>
              <h2>{booking.bookingCode || "—"}</h2>
            </div>

            <span className={`booking-detail-status ${status.className}`}>
              {status.label}
            </span>
          </div>

          <div className="booking-detail-separator" />

          <div className="booking-detail-date-grid">
            <div className="booking-detail-date-box">
              <span>NHẬN PHÒNG</span>
              <strong>{formatDate(booking.checkInDate)}</strong>
            </div>

            <div className="booking-detail-date-box">
              <span>TRẢ PHÒNG</span>
              <strong>{formatDate(booking.checkOutDate)}</strong>
            </div>

            <div className="booking-detail-date-box">
              <span>TỔNG SỐ KHÁCH</span>
              <strong>{booking.guestCount ?? 0} khách</strong>
            </div>
          </div>

          <div className="booking-detail-section">
            <h3>Thông tin khách hàng</h3>

            <div className="booking-customer-info">
              <div className="booking-customer-field">
                <span>Họ và tên</span>
                <strong>
                  {booking.customerName || "Chưa cập nhật"}
                </strong>
              </div>

              <div className="booking-customer-field">
                <span>Email</span>
                <strong>
                  {booking.customerEmail || "Chưa cập nhật"}
                </strong>
              </div>

              <div className="booking-customer-field">
                <span>Số điện thoại</span>
                <strong>
                  {booking.customerPhone || "Chưa cập nhật"}
                </strong>
              </div>
            </div>
          </div>

          <div className="booking-detail-section">
            <h3>
              Phòng đã đặt
              <span className="booking-room-count">
                {rooms.length} phòng
              </span>
            </h3>

            {rooms.length > 0 ? (
              <div className="booking-detail-room-list">
                {rooms.map((room, index) => (
                  <article
                    className="booking-detail-room-card"
                    key={`${room.roomId ?? "room"}-${index}`}
                  >
                    <div className="booking-detail-room-header">
                      <div>
                        <h4>
                          {room.roomNumber
                            ? `Phòng ${room.roomNumber}`
                            : `Mã phòng: ${room.roomId ?? "—"}`}
                        </h4>

                        <p className="booking-room-type">
                          {room.roomTypeName ||
                            "Chưa cập nhật loại phòng"}
                        </p>
                      </div>
                    </div>

                    <div className="booking-detail-room-info">
                      <div>
                        <span>Tầng</span>
                        <strong>{formatFloor(room.floor)}</strong>
                      </div>

                      <div>
                        <span>Diện tích</span>
                        <strong>{formatArea(room.area)}</strong>
                      </div>

                      <div>
                        <span>Loại giường</span>
                        <strong>{room.bedType || "Chưa cập nhật"}</strong>
                      </div>

                      <div>
                        <span>Sức chứa tối đa</span>
                        <strong>
                          {room.capacity != null
                            ? `${room.capacity} khách`
                            : "Chưa cập nhật"}
                        </strong>
                      </div>

                      <div>
                        <span>Số khách trong phòng</span>
                        <strong>
                          {room.guestCount != null
                            ? `${room.guestCount} khách`
                            : "Chưa cập nhật"}
                        </strong>
                      </div>

                      <div>
                        <span>Giá cơ bản</span>
                        <strong>{formatCurrency(room.basePrice)}</strong>
                      </div>
                    </div>

                    {room.roomTypeDescription && (
                      <p className="booking-detail-room-description">
                        <strong>Mô tả loại phòng:</strong>{" "}
                        {room.roomTypeDescription}
                      </p>
                    )}

                    {room.roomDescription && (
                      <p className="booking-detail-room-description">
                        <strong>Mô tả phòng:</strong>{" "}
                        {room.roomDescription}
                      </p>
                    )}

                    <div className="booking-detail-room-price">
                      <span>Giá phòng trong lần đặt này</span>
                      <strong>{formatCurrency(room.roomPrice)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="booking-detail-muted">
                Chưa có thông tin phòng chi tiết cho đặt phòng này.
              </p>
            )}
          </div>

          {/* CHI TIẾT CHI PHÍ */}
<div className="booking-detail-section">
  <h3>Chi tiết chi phí</h3>

  <div className="booking-price-breakdown">
    <div className="booking-price-row">
      <span>Tổng tiền phòng</span>
      <strong>{formatCurrency(totalAmount)}</strong>
    </div>

    {discountCode && (
      <div className="booking-price-row booking-discount-code-row">
        <span>Mã giảm giá</span>
        <span className="booking-discount-code">
          <span className="booking-discount-icon">%</span>
          {discountCode}
        </span>
      </div>
    )}

    <div className="booking-price-row booking-discount-row">
      <span>Số tiền giảm giá</span>
      <strong>
        − {formatCurrency(discountAmount)}
      </strong>
    </div>

    <div className="booking-price-row booking-price-total">
      <span>Thành tiền sau giảm giá</span>
      <strong>{formatCurrency(finalAmount)}</strong>
    </div>

    <div className="booking-payment-divider" />

    <div className="booking-price-row">
      <span>
        <span className="booking-payment-dot deposit-dot" />
        Tiền cọc (30%)
      </span>
      <strong>{formatCurrency(depositAmount)}</strong>
    </div>

    <div className="booking-price-row booking-price-remaining">
      <span>
        <span className="booking-payment-dot remaining-dot" />
        Số tiền còn lại
      </span>
      <strong>{formatCurrency(remainingAmount)}</strong>
    </div>
  </div>

  <p className="booking-detail-payment-note">
    Tiền cọc và số tiền còn lại được tính dựa trên thành tiền
    sau khi áp dụng mã giảm giá.
  </p>
</div>


          {booking.note && (
            <div className="booking-detail-section">
              <h3>Ghi chú</h3>
              <p className="booking-detail-note">{booking.note}</p>
            </div>
          )}

          <div className="booking-detail-created">
            Ngày đặt: {formatDateTime(booking.createdAt)}
          </div>

          {cancelMessage && (
            <p className="booking-cancel-success" role="status">
              {cancelMessage}
            </p>
          )}

          {cancelError && (
            <p className="booking-cancel-error" role="alert">
              {cancelError}
            </p>
          )}

          {canCancel && (
            <div className="booking-cancel-actions">
              <button
                type="button"
                className="booking-cancel-button"
                onClick={() => {
                  setCancelMessage("");
                  setCancelError("");
                  setShowCancelModal(true);
                }}
                disabled={canceling}
              >
                Hủy đặt phòng
              </button>
            </div>
          )}
        </section>
      </div>

      {showCancelModal && (
        <div
          className="booking-cancel-overlay"
          onClick={() => {
            if (!canceling) setShowCancelModal(false);
          }}
        >
          <div
            className="booking-cancel-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="booking-cancel-close"
              aria-label="Đóng"
              disabled={canceling}
              onClick={() => setShowCancelModal(false)}
            >
              &times;
            </button>

            <div className="booking-cancel-icon">!</div>

            <h2 id="cancel-modal-title">
              Xác nhận hủy đặt phòng
            </h2>

            <p className="booking-cancel-subtitle">
              Bạn có chắc chắn muốn hủy đặt phòng này không?
            </p>

            <div className="booking-cancel-booking-code">
              <span>Mã đặt phòng</span>
              <strong>{booking.bookingCode || `#${id}`}</strong>
            </div>

            <div className="booking-cancel-notice">
              <span className="booking-cancel-notice-icon">!</span>
              <p>
                Sau khi xác nhận, trạng thái đặt phòng sẽ chuyển thành
                <strong> Đã hủy</strong>. Bạn sẽ cần đặt phòng mới nếu
                muốn tiếp tục lưu trú.
              </p>
            </div>

            <div className="booking-cancel-modal-actions">
              <button
                type="button"
                className="booking-cancel-back"
                disabled={canceling}
                onClick={() => setShowCancelModal(false)}
              >
                Quay lại
              </button>

              <button
                type="button"
                className="booking-cancel-confirm"
                disabled={canceling}
                onClick={handleCancelBooking}
              >
                {canceling ? "Đang xử lý..." : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
