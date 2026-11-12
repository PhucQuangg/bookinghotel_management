
import React from "react";
import "../css/Dashboard.css";

const revenueData = [
    { month: "T1", value: 42 },
    { month: "T2", value: 58 },
    { month: "T3", value: 48 },
    { month: "T4", value: 72 },
    { month: "T5", value: 65 },
    { month: "T6", value: 88 },
    { month: "T7", value: 76 },
    { month: "T8", value: 95 },
    { month: "T9", value: 68 },
    { month: "T10", value: 83 },
    { month: "T11", value: 58 },
    { month: "T12", value: 92 },
];

const recentBookings = [
    {
        code: "GS260001",
        customer: "Nguyễn Minh Anh",
        room: "Deluxe Room",
        date: "01/11/2026",
        amount: "3.000.000đ",
        status: "CONFIRMED",
    },
    {
        code: "GS260002",
        customer: "Trần Hoàng Nam",
        room: "Superior Room",
        date: "01/11/2026",
        amount: "2.000.000đ",
        status: "PENDING",
    },
    {
        code: "GS260003",
        customer: "Lê Thu Hà",
        room: "Family Room",
        date: "31/10/2026",
        amount: "4.400.000đ",
        status: "COMPLETED",
    },
    {
        code: "GS260004",
        customer: "Phạm Quốc Bảo",
        room: "Deluxe Room",
        date: "31/10/2026",
        amount: "1.500.000đ",
        status: "CANCELED",
    },
];

const statusConfig = {
    CONFIRMED: { label: "Đã xác nhận", className: "confirmed" },
    PENDING: { label: "Chờ xác nhận", className: "pending" },
    COMPLETED: { label: "Hoàn tất", className: "completed" },
    CANCELED: { label: "Đã hủy", className: "canceled" },
};

function Dashboard() {
    const stats = [
        {
            title: "Tổng số phòng",
            value: "120",
            note: "Toàn bộ phòng khách sạn",
            icon: "bi-door-closed",
            color: "blue",
        },
        {
            title: "Phòng đang trống",
            value: "38",
            note: "Sẵn sàng đón khách",
            icon: "bi-door-open",
            color: "green",
        },
        {
            title: "Đặt phòng",
            value: "86",
            note: "Trong tháng này",
            icon: "bi-calendar-check",
            color: "gold",
        },
        {
            title: "Doanh thu",
            value: "245,8 triệu",
            note: "Giao dịch đã thanh toán",
            icon: "bi-cash-stack",
            color: "purple",
        },
    ];

    return (
        <div className="dashboard-page">
            <div className="dashboard-welcome">
                <div>
                    <span className="dashboard-eyebrow">TỔNG QUAN HỆ THỐNG</span>
                    <h2>Chào mừng trở lại!</h2>
                    <p>
                        Đây là tình hình hoạt động tổng quan của GrandStay.
                    </p>
                </div>

                <div className="dashboard-welcome-icon">
                    <i className="bi bi-buildings"></i>
                </div>
            </div>

            <div className="dashboard-stats">
                {stats.map((item) => (
                    <div className="dashboard-stat-card" key={item.title}>
                        <div className={`dashboard-stat-icon ${item.color}`}>
                            <i className={`bi ${item.icon}`}></i>
                        </div>
                        <div className="dashboard-stat-info">
                            <span>{item.title}</span>
                            <h3>{item.value}</h3>
                            <small>{item.note}</small>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-chart-grid">
                <div className="dashboard-card revenue-card">
                    <div className="dashboard-card-heading">
                        <div>
                            <h3>Doanh thu</h3>
                            <p>Biểu đồ doanh thu theo tháng</p>
                        </div>
                        <span className="dashboard-chart-tag">Năm 2026</span>
                    </div>

                    <div className="revenue-summary">
                        <strong>245.800.000đ</strong>
                        <span>
                            <i className="bi bi-graph-up-arrow"></i>
                            Dữ liệu minh họa
                        </span>
                    </div>

                    <div className="revenue-chart">
                        {revenueData.map((item) => (
                            <div className="revenue-column" key={item.month}>
                                <div className="revenue-bar-area">
                                    <div
                                        className="revenue-bar"
                                        style={{ height: `${item.value}%` }}
                                        title={`${item.value}%`}
                                    ></div>
                                </div>
                                <span>{item.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dashboard-card booking-status-card">
                    <div className="dashboard-card-heading">
                        <div>
                            <h3>Trạng thái đặt phòng</h3>
                            <p>Phân loại booking minh họa</p>
                        </div>
                    </div>

                    <div className="booking-donut">
                        <div className="booking-donut-center">
                            <strong>86</strong>
                            <span>Đặt phòng</span>
                        </div>
                    </div>

                    <div className="booking-legend">
                        <div>
                            <span className="legend-dot confirmed-dot"></span>
                            <span>Đã xác nhận</span>
                            <strong>42</strong>
                        </div>
                        <div>
                            <span className="legend-dot pending-dot"></span>
                            <span>Chờ xác nhận</span>
                            <strong>18</strong>
                        </div>
                        <div>
                            <span className="legend-dot completed-dot"></span>
                            <span>Hoàn tất</span>
                            <strong>20</strong>
                        </div>
                        <div>
                            <span className="legend-dot canceled-dot"></span>
                            <span>Đã hủy</span>
                            <strong>6</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-card dashboard-bookings-card">
                <div className="dashboard-card-heading">
                    <div>
                        <h3>Đặt phòng gần đây</h3>
                        <p>Các giao dịch đặt phòng mới nhất</p>
                    </div>
                    <button
                        className="dashboard-view-all"
                        onClick={() => window.location.href = "/admin/bookings"}
                    >
                        Xem tất cả
                        <i className="bi bi-arrow-right"></i>
                    </button>
                </div>

                <div className="dashboard-table-wrapper">
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>MÃ ĐẶT PHÒNG</th>
                                <th>KHÁCH HÀNG</th>
                                <th>LOẠI PHÒNG</th>
                                <th>NGÀY ĐẶT</th>
                                <th>TỔNG TIỀN</th>
                                <th>TRẠNG THÁI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentBookings.map((booking) => {
                                const status = statusConfig[booking.status];

                                return (
                                    <tr key={booking.code}>
                                        <td>
                                            <strong className="dashboard-booking-code">
                                                {booking.code}
                                            </strong>
                                        </td>
                                        <td>{booking.customer}</td>
                                        <td>{booking.room}</td>
                                        <td>{booking.date}</td>
                                        <td>
                                            <strong>{booking.amount}</strong>
                                        </td>
                                        <td>
                                            <span className={`dashboard-status ${status.className}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="dashboard-demo-note">
                <i className="bi bi-info-circle"></i>
                Dashboard hiện đang sử dụng dữ liệu minh họa. Các số liệu sẽ
                được kết nối với cơ sở dữ liệu khi hoàn thiện API quản trị.
            </div>
        </div>
    );
}

export default Dashboard;
