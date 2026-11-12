
import React, { useState } from "react";
import "../css/PaymentOptions.css";

const API_URL = "http://localhost:8080/api";

const formatPrice = (amount) =>
    new Intl.NumberFormat("vi-VN").format(amount || 0) + "đ";

export default function PaymentOptions({ bookingId }) {
    const [method, setMethod] = useState("VNPAY");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [payment, setPayment] = useState(null);

    const handlePayment = async () => {
        if (!bookingId) {
            setError("Không tìm thấy mã đặt phòng.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setPayment(null);

            const token = sessionStorage.getItem("token");

            if (!token) {
                throw new Error("Vui lòng đăng nhập để thanh toán.");
            }

            const response = await fetch(
                `${API_URL}/payments/bookings/${bookingId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        paymentMethod: method,
                    }),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "Không thể tạo yêu cầu thanh toán."
                );
            }

            if (method === "VNPAY") {
                if (!data.paymentUrl) {
                    throw new Error(
                        "Không nhận được đường dẫn thanh toán VNPay."
                    );
                }

                // Chuyển khách sang trang thanh toán VNPay.
                window.location.assign(data.paymentUrl);
                return;
            }

            setPayment(data);
        } catch (err) {
            console.error("Lỗi thanh toán:", err);
            setError(
                err.message || "Không thể kết nối đến máy chủ."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="payment-options">
            <h2>Thanh toán</h2>

            <label className="payment-option">
                <input
                    type="radio"
                    name="paymentMethod"
                    value="VNPAY"
                    checked={method === "VNPAY"}
                    onChange={() => setMethod("VNPAY")}
                    disabled={loading}
                />
                <span>
                    <strong>Thanh toán trực tuyến qua VNPay</strong>
                    <small>Thanh toán qua cổng VNPay Sandbox</small>
                </span>
            </label>

            <label className="payment-option">
                <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH_AT_HOTEL"
                    checked={method === "CASH_AT_HOTEL"}
                    onChange={() => setMethod("CASH_AT_HOTEL")}
                    disabled={loading}
                />
                <span>
                    <strong>Thanh toán tại khách sạn</strong>
                    <small>Trả tiền trực tiếp tại khách sạn</small>
                </span>
            </label>

            <button
                type="button"
                onClick={handlePayment}
                disabled={loading}
            >
                {loading ? "Đang xử lý..." : "Tiếp tục thanh toán"}
            </button>

            {error && (
                <p className="payment-error" role="alert">
                    {error}
                </p>
            )}

            {payment && method === "CASH_AT_HOTEL" && (
                <div className="payment-notice" role="status">
                    <h3>Đã tạo yêu cầu thanh toán</h3>
                    <p>
                        Mã thanh toán: {payment.paymentReference}
                    </p>
                    <p>
                        Số tiền: {formatPrice(payment.amount)}
                    </p>
                    <p>
                        Trạng thái: Chờ thanh toán tại khách sạn
                    </p>
                    <p>
                        Bạn chưa được ghi nhận là đã thanh toán.
                    </p>
                </div>
            )}
        </section>
    );
}
