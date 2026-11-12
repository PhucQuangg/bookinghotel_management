// src/pages/BookingHistory.jsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/BookingHistory.css";

const API_URL = "http://localhost:8080/api/customers/bookings/my-bookings";

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
  if (parts.length !== 3) return date;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0));
}

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      const token = sessionStorage.getItem("token");

      if (!token) {
        setError("Phiên đăng nhập không tồn tại. Vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "Bạn không có quyền xem lịch sử đặt phòng hoặc phiên đăng nhập đã hết hạn."
          );
        }

        if (!response.ok) {
          throw new Error("Không thể tải lịch sử đặt phòng. Vui lòng thử lại.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Dữ liệu lịch sử đặt phòng không đúng định dạng.");
        }

        setBookings(data);
      } catch (err) {
        setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <div className="booking-history-page">
      <div className="booking-history-container">
        <div className="booking-history-header">
          <div>
            <p className="booking-history-eyebrow">GRANDSTAY HOTEL</p>
            <h1>Lịch sử đặt phòng</h1>
            <p className="booking-history-description">
              Theo dõi thông tin và trạng thái các lần đặt phòng của bạn.
            </p>
          </div>

          <Link to="/" className="booking-history-back">
            ← Về trang chủ
          </Link>
        </div>

        {!loading && !error && (
          <div className="booking-history-summary">
            <div className="booking-summary-icon">▤</div>
            <div>
              <span>Tổng số lượt đặt phòng</span>
              <strong>{bookings.length}</strong>
            </div>
          </div>
        )}

        {loading && (
          <div className="booking-history-message">
            <div className="booking-loading-spinner" />
            <p>Đang tải lịch sử đặt phòng...</p>
          </div>
        )}

        {!loading && error && (
          <div className="booking-history-message booking-history-error">
            <div className="booking-message-icon">!</div>
            <h3>Không thể tải dữ liệu</h3>
            <p>{error}</p>
            <button
              type="button"
              className="booking-retry-button"
              onClick={() => window.location.reload()}
            >
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="booking-history-message booking-history-empty">
            <div className="booking-empty-icon">▢</div>
            <h3>Bạn chưa có lịch sử đặt phòng</h3>
            <p>
              Những lần đặt phòng của bạn sẽ xuất hiện tại đây.
            </p>
            <Link to="/" className="booking-browse-button">
              Khám phá phòng
            </Link>
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="booking-history-list">
            {bookings.map((booking) => {
              const status = STATUS_INFO[booking.status] || {
                label: booking.status || "Không xác định",
                className: "unknown",
              };

              return (
                <article
                  className="booking-history-card"
                  key={booking.id}
                >
                  <div className="booking-card-header">
                    <div>
                      <span className="booking-code-label">
                        MÃ ĐẶT PHÒNG
                      </span>
                      <h2>{booking.bookingCode || "—"}</h2>
                    </div>

                    <span
                      className={`booking-status booking-status-${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="booking-card-divider" />

                  <div className="booking-card-details">
                    <div className="booking-detail-item">
                      <span className="booking-detail-icon">↗</span>
                      <div>
                        <span>Ngày nhận phòng</span>
                        <strong>{formatDate(booking.checkInDate)}</strong>
                      </div>
                    </div>

                    <div className="booking-detail-item">
                      <span className="booking-detail-icon">↙</span>
                      <div>
                        <span>Ngày trả phòng</span>
                        <strong>{formatDate(booking.checkOutDate)}</strong>
                      </div>
                    </div>

                    <div className="booking-detail-item">
                      <span className="booking-detail-icon">♙</span>
                      <div>
                        <span>Số lượng khách</span>
                        <strong>{booking.guestCount ?? "—"} khách</strong>
                      </div>
                    </div>
                  </div>

                  <div className="booking-card-footer">

                    <div>
                      <span>Tổng thanh toán</span>
                      <strong className="booking-total-amount">
                        {formatCurrency(booking.finalAmount)}
                      </strong>
                    </div>

                    <div className="booking-created-date">
                      Ngày đặt: {formatDate(booking.createdAt?.slice(0, 10))}
                    </div>
                    <Link
  to={`/booking-history/${booking.id}`}
  className="booking-view-detail"
>
  Xem chi tiết →
</Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

