import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/PaymentResult.css";

const API_URL = "http://localhost:8080/api";


function PaymentResult() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const verifyPayment = async () => {
            try {
                const params = new URLSearchParams(
                    window.location.search
                );

                const responseCode = params.get("vnp_ResponseCode");
                const transactionStatus = params.get(
                    "vnp_TransactionStatus"
                );

                if (
                    responseCode !== "00" ||
                    transactionStatus !== "00"
                ) {
                    throw new Error(
                        "Giao dịch chưa thành công hoặc đã bị hủy. Nếu tài khoản đã bị trừ tiền, vui lòng liên hệ khách sạn."
                    );
                }

                const response = await fetch(
                    `${API_URL}/payments/vnpay/return${window.location.search}`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                        },
                    }
                );

                const data = await response.json().catch(() => ({}));

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message ||
                        "Chưa thể xác nhận đặt phòng. Vui lòng thử kiểm tra lại."
                    );
                }

                if (!cancelled) {
                    setResult(data);
                    setError("");
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message ||
                        "Không thể kết nối đến hệ thống xác nhận thanh toán."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        verifyPayment();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <div className="payment-result-page">
                <div className="payment-confirm-container">
                    <div className="payment-result-loading">
                        <div className="payment-spinner" />
                        <h1>Đang xác nhận đặt phòng</h1>
                        <p>
                            GrandStay đang kiểm tra giao dịch và hoàn tất
                            thông tin đặt phòng của bạn.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="payment-result-page">
                <div className="payment-confirm-container">
                    <div className="payment-result-error">
                        <div className="payment-error-icon">!</div>
                        <h1>Chưa xác nhận được đặt phòng</h1>
                        <p>{error}</p>

                        <div className="payment-result-actions">
                            <button
                                className="payment-primary-btn"
                                onClick={() => window.location.reload()}
                            >
                                Kiểm tra lại
                            </button>

                            <button
                                className="payment-secondary-btn"
                                onClick={() => navigate("/")}
                            >
                                Về trang chủ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const bookingStatus = result?.bookingStatus;
    const paymentStatus = result?.paymentStatus;

    return (
        <div className="payment-result-page">
            <div className="payment-confirm-container">
                <button
                    className="payment-back-btn"
                    onClick={() => navigate("/")}
                >
                    ← Về trang chủ
                </button>

                <div className="payment-result-heading">
                    <div className="payment-success-icon">✓</div>

                    <h1>Đặt phòng thành công!</h1>

                    <p>
                        Cảm ơn bạn đã lựa chọn GrandStay. Thanh toán tiền
                        cọc đã được xác nhận và đơn đặt phòng của bạn đã
                        được tạo thành công.
                    </p>
                </div>

                <div className="payment-result-grid">
                    <section className="payment-result-card">
                        <h2>Thông tin đặt phòng</h2>

                        <div className="payment-booking-code">
                            <span>Mã đặt phòng</span>
                            <strong>{result.bookingCode || "—"}</strong>
                        </div>

                        <div className="payment-info-row">
                            <span>Trạng thái đặt phòng</span>
                            <strong className="payment-status-success">
                                {bookingStatus === "CONFIRMED"
                                    ? "Đã xác nhận"
                                    : bookingStatus || "Chưa cập nhật"}
                            </strong>
                        </div>

                        <div className="payment-info-row">
                            <span>Trạng thái thanh toán</span>
                            <strong className="payment-status-success">
                                {paymentStatus === "PAID"
                                    ? "Đã thanh toán tiền cọc"
                                    : paymentStatus || "Chưa cập nhật"}
                            </strong>
                        </div>

                        <div className="payment-info-row">
                            <span>Phương thức thanh toán</span>
                            <strong>VNPay</strong>
                        </div>

                        <div className="payment-info-row">
                            <span>Mã giao dịch</span>
                            <strong className="payment-reference">
                                {result.paymentReference || "—"}
                            </strong>
                        </div>

                        <div className="payment-result-notice">
                            <span className="payment-notice-icon">i</span>
                            <p>
                                Vui lòng lưu lại mã đặt phòng để tra cứu
                                thông tin và quản lý đơn đặt phòng của bạn.
                            </p>
                        </div>
                    </section>

                    <aside className="payment-result-card payment-summary-card">
                        <h2>Chi tiết xác nhận</h2>

                        <div className="payment-summary-brand">
                            <div className="payment-brand-mark">G</div>
                            <div>
                                <strong>GRANDSTAY</strong>
                                <span>HOTEL &amp; RESORT</span>
                            </div>
                        </div>

                        <div className="payment-summary-divider" />

                        <div className="payment-info-row">
                            <span>Mã đặt phòng</span>
                            <strong>{result.bookingCode || "—"}</strong>
                        </div>

                        <div className="payment-info-row">
                            <span>Trạng thái</span>
                            <strong>
                                {bookingStatus === "CONFIRMED"
                                    ? "Đã xác nhận"
                                    : bookingStatus || "—"}
                            </strong>
                        </div>

                        <div className="payment-info-row">
                            <span>Thanh toán</span>
                            <strong>
                                {paymentStatus === "PAID"
                                    ? "Tiền cọc 30%"
                                    : paymentStatus || "—"}
                            </strong>
                        </div>

                        <div className="payment-summary-total">
                            <span>Kết quả giao dịch</span>
                            <strong>Thành công</strong>
                        </div>

                        <p className="payment-summary-note">
                            Thông tin ngày lưu trú và tổng chi phí được
                            xem đầy đủ trong chi tiết đặt phòng.
                        </p>

                        <button
                            className="payment-primary-btn payment-detail-btn"
                            onClick={() =>
                                navigate(
                                    `/booking-history/${result.bookingId}`
                                )
                            }
                        >
                            Xem chi tiết đặt phòng
                        </button>

                        <button
                            className="payment-secondary-btn payment-home-btn"
                            onClick={() => navigate("/")}
                        >
                            Về trang chủ
                        </button>
                    </aside>
                </div>
            </div>
        </div>
    );
}

export default PaymentResult;