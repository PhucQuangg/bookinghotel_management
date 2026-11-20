
import React, { useEffect, useState } from "react";
import "../css/CustomerManagement.css";
import { useAdminPopup } from "../components/popup/AdminPopupContext";

const API_URL = "http://localhost:8080/api/admin/customers";

function CustomerManagement() {
    const {
        confirm,
        success: showSuccess,
        error: showError
    } = useAdminPopup();

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [keyword, setKeyword] = useState("");
    const [page, setPage] = useState(0);

    const [pagination, setPagination] = useState({
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
    });

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerBookings, setCustomerBookings] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const [activeTab, setActiveTab] = useState("info");

    // Chỉnh sửa khách hàng
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        idCard: "",
    });
    const [savingCustomer, setSavingCustomer] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);

    const getToken = () => {
        return (
            sessionStorage.getItem("token") ||
            sessionStorage.getItem("admin_token")
        );
    };

    const getHeaders = () => {
        const token = getToken();

        return {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    };

    // =========================
    // LẤY DANH SÁCH KHÁCH HÀNG
    // =========================
    const fetchCustomers = async () => {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams({
                page: String(page),
                size: "10",
                sort: "id,desc",
            });

            if (keyword.trim()) {
                params.append("keyword", keyword.trim());
            }

            const response = await fetch(`${API_URL}?${params}`, {
                method: "GET",
                headers: getHeaders(),
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error(
                        "Bạn không có quyền truy cập hoặc phiên đăng nhập đã hết hạn."
                    );
                }

                throw new Error("Không thể tải danh sách khách hàng.");
            }

            const data = await response.json();

            setCustomers(data.content || []);
            setPagination({
                totalElements: data.totalElements || 0,
                totalPages: data.totalPages || 0,
                size: data.size || 10,
                number: data.number || 0,
            });
        } catch (err) {
            setError(err.message);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, keyword]);

    // =========================
    // XEM CHI TIẾT KHÁCH HÀNG
    // =========================
    const handleViewDetail = async (customerId) => {
        try {
            setDetailLoading(true);
            setSelectedCustomer(null);
            setCustomerBookings([]);
            setActiveTab("info");

            const [customerResponse, bookingResponse] = await Promise.all([
                fetch(`${API_URL}/${customerId}`, {
                    headers: getHeaders(),
                }),
                fetch(`${API_URL}/${customerId}/bookings`, {
                    headers: getHeaders(),
                }),
            ]);

            if (!customerResponse.ok) {
                throw new Error("Không thể tải thông tin khách hàng.");
            }

            if (!bookingResponse.ok) {
                throw new Error("Không thể tải lịch sử đặt phòng.");
            }

            const customerData = await customerResponse.json();
            const bookingData = await bookingResponse.json();

            setSelectedCustomer(customerData);
            setCustomerBookings(bookingData || []);
        } catch (err) {
            showError(err.message || "Đã xảy ra lỗi.");
        } finally {
            setDetailLoading(false);
        }
    };

    // =========================
    // ĐỌC THÔNG BÁO LỖI TỪ BACKEND
    // =========================
    const getErrorMessage = async (response, fallback) => {
        const text = await response.text();
        if (!text) return fallback;

        try {
            const data = JSON.parse(text);
            return data.message || data.error || fallback;
        } catch {
            return text || fallback;
        }
    };

    // =========================
    // MỞ FORM CHỈNH SỬA
    // =========================
    const handleOpenEdit = () => {
        if (!selectedCustomer) return;

        setEditForm({
            fullName: selectedCustomer.fullName || "",
            email: selectedCustomer.email || "",
            phone: selectedCustomer.phone || "",
            address: selectedCustomer.address || "",
            idCard: selectedCustomer.idCard || "",
        });
        setShowEditModal(true);
    };

    // =========================
    // CẬP NHẬT THÔNG TIN KHÁCH HÀNG
    // =========================
    const handleUpdateCustomer = async (e) => {
        e.preventDefault();
        if (!selectedCustomer) return;

        try {
            setSavingCustomer(true);

            const response = await fetch(`${API_URL}/${selectedCustomer.id}`, {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify({
                    fullName: editForm.fullName.trim(),
                    email: editForm.email.trim(),
                    phone: editForm.phone.trim(),
                    address: editForm.address.trim(),
                    idCard: editForm.idCard.trim(),
                }),
            });

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(response, "Cập nhật thông tin khách hàng thất bại.")
                );
            }

            const updatedCustomer = await response.json();

            setSelectedCustomer(updatedCustomer);
            setCustomers((prev) =>
                prev.map((customer) =>
                    customer.id === updatedCustomer.id
                        ? { ...customer, ...updatedCustomer }
                        : customer
                )
            );
            setShowEditModal(false);
            showSuccess("Cập nhật thông tin khách hàng thành công!");
        } catch (err) {
            window.showError(err.message || "Đã xảy ra lỗi.");
        } finally {
            setSavingCustomer(false);
        }
    };

    // =========================
    // KHÓA / MỞ KHÓA TÀI KHOẢN
    // =========================
    const handleToggleCustomerStatus = async (customer) => {
        const isLocked = customer.userStatus === "LOCKED";
        const nextStatus = isLocked ? "ACTIVE" : "LOCKED";
        const actionText = isLocked ? "mở khóa" : "khóa";

        const isConfirmed = await confirm({
            title: isLocked
                ? "Xác nhận mở khóa tài khoản"
                : "Xác nhận khóa tài khoản",
            message: `Bạn có chắc chắn muốn ${actionText} tài khoản của ${customer.fullName}?`,
            confirmText: isLocked ? "Mở khóa" : "Khóa tài khoản",
            cancelText: "Hủy",
            danger: !isLocked
        });

        if (!isConfirmed) return;

        try {
            setUpdatingStatusId(customer.id);

            const response = await fetch(
                `${API_URL}/${customer.id}/status?status=${nextStatus}`,
                {
                    method: "PATCH",
                    headers: getHeaders(),
                }
            );

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(response, `${actionText} tài khoản thất bại.`)
                );
            }

            const updatedCustomer = await response.json();

            setCustomers((prev) =>
                prev.map((item) =>
                    item.id === customer.id
                        ? { ...item, ...updatedCustomer }
                        : item
                )
            );

            setSelectedCustomer((prev) =>
                prev && prev.id === customer.id
                    ? { ...prev, ...updatedCustomer }
                    : prev
            );

            showSuccess(
                isLocked
                    ? "Đã mở khóa tài khoản khách hàng."
                    : "Đã khóa tài khoản khách hàng."
            );
        } catch (err) {
            showError(err.message || `${actionText} tài khoản thất bại.`);
        } finally {
            setUpdatingStatusId(null);
        }
    };

    // =========================
    // ĐỊNH DẠNG TIỀN
    // =========================
    const formatMoney = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount || 0);
    };

    // =========================
    // ĐỊNH DẠNG NGÀY
    // =========================
    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("vi-VN");
    };

    // =========================
    // TRẠNG THÁI BOOKING
    // =========================
    const getBookingStatus = (status) => {
        const statuses = {
            PENDING: {
                label: "Chờ xác nhận",
                className: "pending",
            },
            CONFIRMED: {
                label: "Đã xác nhận",
                className: "confirmed",
            },
            CHECKED_IN: {
                label: "Đang lưu trú",
                className: "checked-in",
            },
            COMPLETED: {
                label: "Hoàn thành",
                className: "completed",
            },
            CANCELED: {
                label: "Đã hủy",
                className: "canceled",
            },
        };

        return statuses[status] || {
            label: status || "Không xác định",
            className: "default",
        };
    };

    const getAccountStatus = (status) => {
        const statuses = {
            ACTIVE: {
                label: "Hoạt động",
                className: "active",
            },
            INACTIVE: {
                label: "Không hoạt động",
                className: "inactive",
            },
            LOCKED: {
                label: "Đã khóa",
                className: "locked",
            },
            BLOCKED: {
                label: "Đã khóa",
                className: "locked",
            },
        };

        return statuses[status] || {
            label: status || "Chưa xác định",
            className: "default",
        };
    };

    const totalCustomers = pagination.totalElements;

    const customersWithBookings = customers.filter(
        (customer) => (customer.totalBookings || 0) > 0
    ).length;

    const totalBookingsOnPage = customers.reduce(
        (total, customer) => total + (customer.totalBookings || 0),
        0
    );

    return (
        <div className="customer-management">

            {/* PAGE HEADER */}
            <div className="customer-page-heading">
                <div>
                    <span className="customer-eyebrow">
                        GRANDSTAY HOTEL & RESORT
                    </span>

                    <h2>Danh sách khách hàng</h2>

                    <p>
                        Quản lý thông tin và theo dõi lịch sử đặt phòng
                        của khách hàng.
                    </p>
                </div>

                <div className="customer-heading-icon">
                    <i className="bi bi-people"></i>
                </div>
            </div>

            {/* STATISTICS */}
            <div className="customer-statistics">

                <div className="customer-stat-card">
                    <div className="customer-stat-icon green">
                        <i className="bi bi-people-fill"></i>
                    </div>

                    <div>
                        <span>Tổng khách hàng</span>
                        <h3>{totalCustomers.toLocaleString("vi-VN")}</h3>
                        <small>Khách hàng trong hệ thống</small>
                    </div>
                </div>

                <div className="customer-stat-card">
                    <div className="customer-stat-icon blue">
                        <i className="bi bi-person-check-fill"></i>
                    </div>

                    <div>
                        <span>Có phát sinh đặt phòng</span>
                        <h3>{customersWithBookings}</h3>
                        <small>Trong trang hiện tại</small>
                    </div>
                </div>

                <div className="customer-stat-card">
                    <div className="customer-stat-icon orange">
                        <i className="bi bi-calendar-check-fill"></i>
                    </div>

                    <div>
                        <span>Tổng lượt đặt phòng</span>
                        <h3>{totalBookingsOnPage}</h3>
                        <small>Tổng của khách hàng trong trang hiện tại</small>
                    </div>
                </div>

            </div>

            {/* CUSTOMER TABLE */}
            <div className="customer-table-card">

                <div className="customer-table-header">
                    <div>
                        <h3>Thông tin khách hàng</h3>
                        <p>
                            Hiện có {totalCustomers} khách hàng
                        </p>
                    </div>

                    <div className="customer-search">
                        <i className="bi bi-search"></i>

                        <input
                            type="text"
                            placeholder="Tìm tên, email, SĐT, username..."
                            value={keyword}
                            onChange={(e) => {
                                setKeyword(e.target.value);
                                setPage(0);
                            }}
                        />

                        {keyword && (
                            <button
                                type="button"
                                onClick={() => {
                                    setKeyword("");
                                    setPage(0);
                                }}
                                title="Xóa tìm kiếm"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="customer-error">
                        <i className="bi bi-exclamation-circle"></i>
                        {error}
                        <button onClick={fetchCustomers}>
                            Thử lại
                        </button>
                    </div>
                )}

                <div className="customer-table-wrapper">
                    <table className="customer-table">
                        <thead>
                            <tr>
                                <th>KHÁCH HÀNG</th>
                                <th>THÔNG TIN LIÊN HỆ</th>
                                <th>TÀI KHOẢN</th>
                                <th>LƯỢT ĐẶT PHÒNG</th>
                                <th>TRẠNG THÁI</th>
                                <th className="text-center">THAO TÁC</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6">
                                        <div className="customer-loading">
                                            <div className="customer-spinner"></div>
                                            <span>Đang tải dữ liệu...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan="6">
                                        <div className="customer-empty">
                                            <i className="bi bi-people"></i>
                                            <h4>Không tìm thấy khách hàng</h4>
                                            <p>
                                                Vui lòng thử lại với từ khóa khác.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => {
                                    const accountStatus = getAccountStatus(
                                        customer.userStatus
                                    );

                                    return (
                                        <tr key={customer.id}>
                                            <td>
                                                <div className="customer-info-cell">
                                                    <div className="customer-avatar">
                                                        {customer.avatar ? (
                                                            <img
                                                                src={customer.avatar}
                                                                alt={customer.fullName}
                                                            />
                                                        ) : (
                                                            <i className="bi bi-person-fill"></i>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {customer.fullName}
                                                        </strong>


                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="customer-contact">
                                                    <span>
                                                        <i className="bi bi-envelope"></i>
                                                        {customer.email || "—"}
                                                    </span>

                                                    <span>
                                                        <i className="bi bi-telephone"></i>
                                                        {customer.phone || "—"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <div className="customer-account">
                                                    <strong>
                                                        {customer.username || "—"}
                                                    </strong>

                                                    <span>
                                                        {customer.role || "CUSTOMER"}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="customer-booking-count">
                                                    <i className="bi bi-calendar2-check"></i>
                                                    {customer.totalBookings || 0}
                                                </span>
                                            </td>

                                            <td>
                                                <span className={`customer-status ${accountStatus.className}`}>
                                                    <span className="status-dot"></span>
                                                    {accountStatus.label}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="customer-actions">
                                                    <button
                                                        type="button"
                                                        className="customer-view-btn"
                                                        onClick={() =>
                                                            handleViewDetail(customer.id)
                                                        }
                                                        title="Xem chi tiết"
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                        Chi tiết
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className={`customer-lock-btn ${customer.userStatus === "LOCKED" ? "unlock" : "lock"}`}
                                                        onClick={() => handleToggleCustomerStatus(customer)}
                                                        disabled={updatingStatusId === customer.id}
                                                        title={customer.userStatus === "LOCKED" ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                                                    >
                                                        <i className={`bi ${customer.userStatus === "LOCKED" ? "bi-unlock" : "bi-lock"}`}></i>
                                                        {updatingStatusId === customer.id
                                                            ? "Đang xử lý..."
                                                            : customer.userStatus === "LOCKED"
                                                                ? "Mở khóa"
                                                                : "Khóa"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {!loading && pagination.totalPages > 0 && (
                    <div className="customer-pagination">
                        <span>
                            Trang {pagination.number + 1} / {pagination.totalPages}
                            <span className="pagination-total">
                                ({pagination.totalElements} khách hàng)
                            </span>
                        </span>

                        <div className="pagination-buttons">
                            <button
                                type="button"
                                disabled={page === 0}
                                onClick={() => setPage((prev) => prev - 1)}
                            >
                                <i className="bi bi-chevron-left"></i>
                            </button>

                            {Array.from(
                                { length: pagination.totalPages },
                                (_, index) => index
                            )
                                .filter((index) =>
                                    Math.abs(index - page) <= 2
                                )
                                .map((index) => (
                                    <button
                                        type="button"
                                        key={index}
                                        className={
                                            page === index ? "active" : ""
                                        }
                                        onClick={() => setPage(index)}
                                    >
                                        {index + 1}
                                    </button>
                                ))}

                            <button
                                type="button"
                                disabled={page >= pagination.totalPages - 1}
                                onClick={() => setPage((prev) => prev + 1)}
                            >
                                <i className="bi bi-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* CUSTOMER DETAIL MODAL */}
            {!showEditModal && (detailLoading || selectedCustomer) && (
                <div
                    className="customer-modal-overlay"
                    onClick={() => {
                        if (!detailLoading) {
                            setSelectedCustomer(null);
                        }
                    }}
                >
                    <div
                        className="customer-detail-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {detailLoading ? (
                            <div className="customer-modal-loading">
                                <div className="customer-spinner"></div>
                                <span>Đang tải thông tin khách hàng...</span>
                            </div>
                        ) : selectedCustomer && (
                            <>
                                <div className="customer-modal-header">
                                    <div>
                                        <span>GRANDSTAY / CUSTOMER</span>
                                        <h3>Chi tiết khách hàng</h3>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedCustomer(null)}
                                    >
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                </div>

                                <div className="customer-detail-profile">
                                    <div className="customer-detail-avatar">
                                        {selectedCustomer.avatar ? (
                                            <img
                                                src={selectedCustomer.avatar}
                                                alt={selectedCustomer.fullName}
                                            />
                                        ) : (
                                            <i className="bi bi-person-fill"></i>
                                        )}
                                    </div>

                                    <div>
                                        <h3>{selectedCustomer.fullName}</h3>
                                        <span>
                                            Mã khách hàng: #{selectedCustomer.id}
                                        </span>
                                    </div>

                                    <span className={`customer-status ${getAccountStatus(selectedCustomer.userStatus).className}`}>
                                        <span className="status-dot"></span>
                                        {getAccountStatus(selectedCustomer.userStatus).label}
                                    </span>
                                </div>

                                <div className="customer-detail-tabs">
                                    <button
                                        className={activeTab === "info" ? "active" : ""}
                                        onClick={() => setActiveTab("info")}
                                    >
                                        <i className="bi bi-person"></i>
                                        Thông tin cá nhân
                                    </button>

                                    <button
                                        className={activeTab === "bookings" ? "active" : ""}
                                        onClick={() => setActiveTab("bookings")}
                                    >
                                        <i className="bi bi-calendar-check"></i>
                                        Lịch sử đặt phòng
                                        <span>{customerBookings.length}</span>
                                    </button>
                                </div>

                                {activeTab === "info" ? (
                                    <div className="customer-detail-content">
                                        <div className="customer-detail-grid">
                                            <div className="customer-detail-item">
                                                <label>Họ và tên</label>
                                                <strong>
                                                    {selectedCustomer.fullName || "—"}
                                                </strong>
                                            </div>

                                            <div className="customer-detail-item">
                                                <label>Tên đăng nhập</label>
                                                <strong>
                                                    {selectedCustomer.username || "—"}
                                                </strong>
                                            </div>

                                            <div className="customer-detail-item">
                                                <label>Email</label>
                                                <strong>
                                                    {selectedCustomer.email || "—"}
                                                </strong>
                                            </div>

                                            <div className="customer-detail-item">
                                                <label>Số điện thoại</label>
                                                <strong>
                                                    {selectedCustomer.phone || "—"}
                                                </strong>
                                            </div>

                                            <div className="customer-detail-item">
                                                <label>CCCD / CMND</label>
                                                <strong>
                                                    {selectedCustomer.idCard || "—"}
                                                </strong>
                                            </div>

                                            <div className="customer-detail-item">
                                                <label>Vai trò</label>
                                                <strong>
                                                    {selectedCustomer.role || "CUSTOMER"}
                                                </strong>
                                            </div>

                                            <div className="customer-detail-item full">
                                                <label>Địa chỉ</label>
                                                <strong>
                                                    {selectedCustomer.address || "Chưa cập nhật"}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="customer-detail-summary">
                                            <div>
                                                <span>Tổng lượt đặt phòng</span>
                                                <strong>
                                                    {selectedCustomer.totalBookings || 0}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>Trạng thái tài khoản</span>
                                                <strong>
                                                    {getAccountStatus(selectedCustomer.userStatus).label}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="customer-detail-actions">
                                            <button
                                                type="button"
                                                className="customer-edit-btn"
                                                onClick={handleOpenEdit}
                                            >
                                                <i className="bi bi-pencil-square"></i>
                                                Chỉnh sửa thông tin
                                            </button>

                                            <button
                                                type="button"
                                                className={`customer-lock-btn ${selectedCustomer.userStatus === "LOCKED" ? "unlock" : "lock"}`}
                                                onClick={() => handleToggleCustomerStatus(selectedCustomer)}
                                                disabled={updatingStatusId === selectedCustomer.id}
                                            >
                                                <i className={`bi ${selectedCustomer.userStatus === "LOCKED" ? "bi-unlock" : "bi-lock"}`}></i>
                                                {updatingStatusId === selectedCustomer.id
                                                    ? "Đang xử lý..."
                                                    : selectedCustomer.userStatus === "LOCKED"
                                                        ? "Mở khóa tài khoản"
                                                        : "Khóa tài khoản"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="customer-booking-history">
                                        {customerBookings.length === 0 ? (
                                            <div className="customer-empty">
                                                <i className="bi bi-calendar-x"></i>
                                                <h4>Chưa có lịch sử đặt phòng</h4>
                                                <p>
                                                    Khách hàng chưa phát sinh booking nào.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="customer-booking-table-wrapper">
                                                <table className="customer-booking-table">
                                                    <thead>
                                                        <tr>
                                                            <th>MÃ BOOKING</th>
                                                            <th>NHẬN PHÒNG</th>
                                                            <th>TRẢ PHÒNG</th>
                                                            <th>SỐ KHÁCH</th>
                                                            <th>TỔNG TIỀN</th>
                                                            <th>TRẠNG THÁI</th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {customerBookings.map((booking) => {
                                                            const status = getBookingStatus(
                                                                booking.status
                                                            );

                                                            return (
                                                                <tr key={booking.id}>
                                                                    <td>
                                                                        <strong>
                                                                            {booking.bookingCode}
                                                                        </strong>
                                                                    </td>

                                                                    <td>
                                                                        {formatDate(booking.checkInDate)}
                                                                    </td>

                                                                    <td>
                                                                        {formatDate(booking.checkOutDate)}
                                                                    </td>

                                                                    <td>
                                                                        {booking.guestCount}
                                                                    </td>

                                                                    <td className="booking-amount">
                                                                        {formatMoney(booking.finalAmount)}
                                                                    </td>

                                                                    <td>
                                                                        <span className={`customer-booking-status ${status.className}`}>
                                                                            {status.label}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="customer-modal-footer">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCustomer(null)}
                                    >
                                        Đóng
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* EDIT CUSTOMER MODAL */}
            {showEditModal && selectedCustomer && (
                <div
                    className="customer-edit-overlay"
                    style={{ position: "fixed", inset: 0, zIndex: 20000 }}
                    onClick={() => {
                        if (!savingCustomer) setShowEditModal(false);
                    }}
                >
                    <div
                        className="customer-edit-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="customer-modal-header">
                            <div>
                                <span>GRANDSTAY / CUSTOMER</span>
                                <h3>Chỉnh sửa thông tin khách hàng</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                disabled={savingCustomer}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateCustomer}>
                            <div className="customer-edit-form">
                                <div className="customer-edit-field">
                                    <label>Họ và tên <span>*</span></label>
                                    <input
                                        type="text"
                                        value={editForm.fullName}
                                        onChange={(e) => setEditForm({
                                            ...editForm,
                                            fullName: e.target.value
                                        })}
                                        placeholder="Nhập họ và tên"
                                        required
                                        maxLength={150}
                                    />
                                </div>

                                <div className="customer-edit-field">
                                    <label>Email <span>*</span></label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({
                                            ...editForm,
                                            email: e.target.value
                                        })}
                                        placeholder="example@email.com"
                                        required
                                        maxLength={150}
                                    />
                                </div>

                                <div className="customer-edit-field">
                                    <label>Số điện thoại <span>*</span></label>
                                    <input
                                        type="tel"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({
                                            ...editForm,
                                            phone: e.target.value
                                        })}
                                        placeholder="Nhập số điện thoại"
                                        required
                                        maxLength={20}
                                    />
                                </div>

                                <div className="customer-edit-field">
                                    <label>CCCD / CMND</label>
                                    <input
                                        type="text"
                                        value={editForm.idCard}
                                        onChange={(e) => setEditForm({
                                            ...editForm,
                                            idCard: e.target.value
                                        })}
                                        placeholder="Nhập số CCCD / CMND"
                                        maxLength={30}
                                    />
                                </div>

                                <div className="customer-edit-field full">
                                    <label>Địa chỉ</label>
                                    <textarea
                                        value={editForm.address}
                                        onChange={(e) => setEditForm({
                                            ...editForm,
                                            address: e.target.value
                                        })}
                                        placeholder="Nhập địa chỉ khách hàng"
                                        rows={3}
                                        maxLength={500}
                                    />
                                </div>
                            </div>

                            <div className="customer-edit-footer">
                                <button
                                    type="button"
                                    className="customer-edit-cancel"
                                    onClick={() => setShowEditModal(false)}
                                    disabled={savingCustomer}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="customer-edit-save"
                                    disabled={savingCustomer}
                                >
                                    {savingCustomer ? (
                                        <>
                                            <span className="customer-button-spinner"></span>
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg"></i>
                                            Lưu thay đổi
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default CustomerManagement;
