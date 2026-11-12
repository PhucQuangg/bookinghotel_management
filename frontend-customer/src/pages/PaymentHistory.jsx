
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/PaymentHistory.css";

const API_URL = "http://localhost:8080/api/payments";

const formatPrice = (value) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(Number(value) || 0);

const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
};

const formatDateTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
};

const STATUS_CONFIG = {
    PAID: {
        label: "Thành công",
        className: "paid",
    },
    PENDING: {
        label: "Đang xử lý",
        className: "pending",
    },
    FAILED: {
        label: "Thất bại",
        className: "failed",
    },
    CANCELLED: {
        label: "Đã hủy",
        className: "cancelled",
    },
};

function PaymentHistory() {
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [keyword, setKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const [selectedPayment, setSelectedPayment] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");

    const token = sessionStorage.getItem("token");

    // Lấy lịch sử thanh toán
    useEffect(() => {
        const fetchPaymentHistory = async () => {
            if (!token) {
                setError("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const response = await fetch(`${API_URL}/history`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                const data = await response.json().catch(() => []);

                if (!response.ok) {
                    throw new Error(
                        data?.message || "Không thể tải lịch sử thanh toán."
                    );
                }

                setPayments(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu.");
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentHistory();
    }, [token]);

    // Thống kê giao dịch
    const statistics = useMemo(() => {
        const paidPayments = payments.filter(
            (payment) => payment.paymentStatus === "PAID"
        );

        const totalPaid = paidPayments.reduce(
            (sum, payment) => sum + Number(payment.amount || 0),
            0
        );

        return {
            totalTransactions: payments.length,
            successfulTransactions: paidPayments.length,
            totalPaid,
        };
    }, [payments]);

    // Tìm kiếm và lọc
    const filteredPayments = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase();

        return payments.filter((payment) => {
            const matchesKeyword =
                !normalizedKeyword ||
                String(payment.paymentReference || "")
                    .toLowerCase()
                    .includes(normalizedKeyword) ||
                String(payment.bookingCode || "")
                    .toLowerCase()
                    .includes(normalizedKeyword);

            const matchesStatus =
                statusFilter === "ALL" ||
                payment.paymentStatus === statusFilter;

            return matchesKeyword && matchesStatus;
        });
    }, [payments, keyword, statusFilter]);

    // Xem chi tiết giao dịch
    const handleViewDetail = async (payment) => {
        setSelectedPayment(payment);
        setDetailError("");

        if (!token) {
            setDetailError("Phiên đăng nhập không hợp lệ.");
            return;
        }

        try {
            setDetailLoading(true);

            const response = await fetch(
                `${API_URL}/history/${payment.id}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data?.message || "Không thể tải chi tiết giao dịch."
                );
            }

            setSelectedPayment(data);
        } catch (err) {
            setDetailError(err.message || "Không thể tải chi tiết giao dịch.");
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setSelectedPayment(null);
        setDetailError("");
    };

    const getStatus = (status) => {
        return STATUS_CONFIG[status] || {
            label: status || "Không xác định",
            className: "unknown",
        };
    };

    return (
        <div className="payment-history-page">
            <div className="payment-history-container">
                {/* Header */}
                {/* Header */}
<div className="payment-page-heading">
    <div className="payment-heading-content">

        <button
            type="button"
            className="payment-back-btn"
            onClick={() => navigate(-1)}
        >
            <i className="bi bi-arrow-left"></i>
            <span>Quay lại</span>
        </button>

        <span className="payment-eyebrow">
            GRANDSTAY HOTEL
        </span>

        <h1>Lịch sử thanh toán</h1>

        <p>
            Theo dõi và quản lý các giao dịch thanh toán
            đặt phòng của bạn.
        </p>
    </div>

    <div className="payment-heading-icon">
        <i className="bi bi-wallet2"></i>
    </div>
</div>

                {/* Statistics */}
                <div className="payment-statistics">
                    <div className="payment-stat-card">
                        <div className="payment-stat-icon total-icon">
                            <i className="bi bi-receipt"></i>
                        </div>

                        <div>
                            <span>Tổng giao dịch</span>
                            <h3>{statistics.totalTransactions}</h3>
                            <small>Tất cả giao dịch</small>
                        </div>
                    </div>

                    <div className="payment-stat-card">
                        <div className="payment-stat-icon success-icon">
                            <i className="bi bi-check-circle"></i>
                        </div>

                        <div>
                            <span>Giao dịch thành công</span>
                            <h3>{statistics.successfulTransactions}</h3>
                            <small>Đã xác nhận thanh toán</small>
                        </div>
                    </div>

                    <div className="payment-stat-card paid-total-card">
                        <div className="payment-stat-icon money-icon">
                            <i className="bi bi-cash-stack"></i>
                        </div>

                        <div>
                            <span>Tổng tiền đã thanh toán</span>
                            <h3>{formatPrice(statistics.totalPaid)}</h3>
                            <small>Chỉ tính giao dịch thành công</small>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="payment-content-card">
                    <div className="payment-content-heading">
                        <div>
                            <h2>Danh sách giao dịch</h2>
                            <p>
                                Thông tin các lần thanh toán đặt phòng của bạn.
                            </p>
                        </div>

                        <span className="payment-result-count">
                            {filteredPayments.length} giao dịch
                        </span>
                    </div>

                    {/* Search and filter */}
                    <div className="payment-toolbar">
                        <div className="payment-search">
                            <i className="bi bi-search"></i>
                            <input
                                type="text"
                                placeholder="Tìm mã giao dịch hoặc mã đặt phòng..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                            />

                            {keyword && (
                                <button
                                    type="button"
                                    className="payment-clear-search"
                                    onClick={() => setKeyword("")}
                                    aria-label="Xóa tìm kiếm"
                                >
                                    <i className="bi bi-x-circle"></i>
                                </button>
                            )}
                        </div>

                        <div className="payment-filter">
                            <i className="bi bi-funnel"></i>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="PAID">Thành công</option>
                                <option value="PENDING">Đang xử lý</option>
                                <option value="FAILED">Thất bại</option>
                                <option value="CANCELLED">Đã hủy</option>
                            </select>
                        </div>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="payment-state">
                            <div className="payment-spinner"></div>
                            <p>Đang tải lịch sử thanh toán...</p>
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="payment-state payment-error">
                            <i className="bi bi-exclamation-circle"></i>
                            <h3>Không thể tải dữ liệu</h3>
                            <p>{error}</p>
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && !error && filteredPayments.length === 0 && (
                        <div className="payment-state">
                            <div className="payment-empty-icon">
                                <i className="bi bi-wallet"></i>
                            </div>

                            <h3>
                                {payments.length === 0
                                    ? "Bạn chưa có giao dịch nào"
                                    : "Không tìm thấy giao dịch"}
                            </h3>

                            <p>
                                {payments.length === 0
                                    ? "Các giao dịch thanh toán đặt phòng sẽ được hiển thị tại đây."
                                    : "Thử thay đổi từ khóa hoặc trạng thái lọc."}
                            </p>

                            {(keyword || statusFilter !== "ALL") && (
                                <button
                                    type="button"
                                    className="payment-reset-button"
                                    onClick={() => {
                                        setKeyword("");
                                        setStatusFilter("ALL");
                                    }}
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>
                    )}

                    {/* Payment list */}
                    {!loading && !error && filteredPayments.length > 0 && (
                        <div className="payment-table-wrapper">
                            <table className="payment-table">
                                <thead>
                                    <tr>
                                        <th>GIAO DỊCH</th>
                                        <th>MÃ ĐẶT PHÒNG</th>
                                        <th>THỜI GIAN</th>
                                        <th>PHƯƠNG THỨC</th>
                                        <th>SỐ TIỀN</th>
                                        <th>TRẠNG THÁI</th>
                                        <th></th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredPayments.map((payment) => {
                                        const status = getStatus(
                                            payment.paymentStatus
                                        );

                                        return (
                                            <tr key={payment.id}>
                                                <td>
                                                    <div className="payment-reference">
                                                        <span className="payment-row-icon">
                                                            <i className="bi bi-credit-card"></i>
                                                        </span>

                                                        <div>
                                                            <strong>
                                                                {payment.paymentReference}
                                                            </strong>
                                                       
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="payment-booking-code">
                                                        {payment.bookingCode || "Chưa tạo"}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="payment-date">
                                                        {formatDateTime(payment.createdAt)}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="payment-method">
                                                        <i className="bi bi-bank"></i>
                                                        {payment.paymentMethod || "—"}
                                                    </span>
                                                </td>

                                                <td>
                                                    <strong className="payment-amount">
                                                        {formatPrice(payment.amount)}
                                                    </strong>
                                                </td>

                                                <td>
                                                    <span
                                                        className={`payment-status ${status.className}`}
                                                    >
                                                        <span className="status-dot"></span>
                                                        {status.label}
                                                    </span>
                                                </td>

                                                <td>
                                                    <button
                                                        type="button"
                                                        className="payment-detail-button"
                                                        onClick={() =>
                                                            handleViewDetail(payment)
                                                        }
                                                        title="Xem chi tiết"
                                                    >
                                                        <i className="bi bi-chevron-right"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="payment-content-footer">
                        <span>
                            Hiển thị {filteredPayments.length} / {payments.length} giao dịch
                        </span>
                        <span>
                            <i className="bi bi-shield-check"></i>
                            Thông tin giao dịch được bảo mật
                        </span>
                    </div>
                </div>

                {/* Payment detail modal */}
                {selectedPayment && (
                    <div
                        className="payment-modal-overlay"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) closeDetail();
                        }}
                    >
                        <div className="payment-modal">
                            <div className="payment-modal-header">
                                <div>
                                    <span>GRANDSTAY</span>
                                    <h2>Chi tiết giao dịch</h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeDetail}
                                    aria-label="Đóng"
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            </div>

                            {detailLoading ? (
                                <div className="payment-state">
                                    <div className="payment-spinner"></div>
                                    <p>Đang tải chi tiết giao dịch...</p>
                                </div>
                            ) : detailError ? (
                                <div className="payment-modal-error">
                                    {detailError}
                                </div>
                            ) : (
                                <>
                                    <div className="payment-modal-summary">
                                        <span>Số tiền giao dịch</span>
                                        <h2>
                                            {formatPrice(selectedPayment.amount)}
                                        </h2>

                                        {(() => {
                                            const status = getStatus(
                                                selectedPayment.paymentStatus
                                            );

                                            return (
                                                <span
                                                    className={`payment-status ${status.className}`}
                                                >
                                                    <span className="status-dot"></span>
                                                    {status.label}
                                                </span>
                                            );
                                        })()}
                                    </div>

                                    <div className="payment-detail-list">
                                        <div className="payment-detail-item">
                                            <span>Mã giao dịch</span>
                                            <strong>
                                                {selectedPayment.paymentReference || "—"}
                                            </strong>
                                        </div>

                                        <div className="payment-detail-item">
                                            <span>Mã đặt phòng</span>
                                            <strong>
                                                {selectedPayment.bookingCode || "Chưa tạo"}
                                            </strong>
                                        </div>

                                        <div className="payment-detail-item">
                                            <span>Mã giao dịch VNPay</span>
                                            <strong>
                                                {selectedPayment.providerTransactionNo || "—"}
                                            </strong>
                                        </div>

                                        <div className="payment-detail-item">
                                            <span>Phương thức thanh toán</span>
                                            <strong>
                                                {selectedPayment.paymentMethod || "—"}
                                            </strong>
                                        </div>

                                        <div className="payment-detail-item">
                                            <span>Ngày tạo giao dịch</span>
                                            <strong>
                                                {formatDateTime(selectedPayment.createdAt)}
                                            </strong>
                                        </div>

                                        <div className="payment-detail-item">
                                            <span>Ngày thanh toán</span>
                                            <strong>
                                                {formatDateTime(selectedPayment.paidAt)}
                                            </strong>
                                        </div>

                                        <div className="payment-detail-divider"></div>

                                        <div className="payment-detail-item">
                                            <span>Tổng tiền đặt phòng</span>
                                            <strong>
                                                {formatPrice(selectedPayment.totalAmount)}
                                            </strong>
                                        </div>

                                        <div className="payment-detail-item">
                                            <span>Mã giảm giá</span>
                                            <strong>
                                                {selectedPayment.discountCode || "Không áp dụng"}
                                            </strong>
                                        </div>

                                        <div className="payment-detail-item">
                                            <span>Số tiền giảm</span>
                                            <strong className="discount-value">
                                                - {formatPrice(selectedPayment.discountAmount)}
                                            </strong>
                                        </div>

                                        <div className="payment-detail-item">
                                            <span>Thành tiền sau giảm</span>
                                            <strong>
                                                {formatPrice(selectedPayment.finalAmount)}
                                            </strong>
                                        </div>

                                        <div className="payment-detail-divider"></div>

                                        <div className="payment-detail-item">
                                            <span>Ngày nhận phòng</span>
                                            <strong>
                                                {formatDate(selectedPayment.checkInDate)}
                                            </strong>
                                        </div>

                                        <div className="payment-detail-item">
                                            <span>Ngày trả phòng</span>
                                            <strong>
                                                {formatDate(selectedPayment.checkOutDate)}
                                            </strong>
                                        </div>

                                        <div className="payment-detail-item">
                                            <span>Số lượng khách</span>
                                            <strong>
                                                {selectedPayment.guestCount ?? "—"}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="payment-modal-note">
                                        <i className="bi bi-info-circle"></i>
                                        Số tiền giao dịch là khoản tiền khách đã thanh toán
                                        cho giao dịch này. Giao dịch đang xử lý hoặc thất bại
                                        chưa được tính là tiền đã thanh toán.
                                    </div>
                                </>
                            )}

                            <button
                                type="button"
                                className="payment-modal-close"
                                onClick={closeDetail}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default PaymentHistory;
