
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

const menuItems = [
    { label: "Tổng quan", icon: "bi-grid-1x2-fill", path: "/admin" },
    { label: "Quản lý đặt phòng", icon: "bi-calendar-check", path: "/admin/bookings" },
    { label: "Quản lý phòng", icon: "bi-door-open", path: "/admin/rooms" },
    { label: "Loại phòng", icon: "bi-buildings", path: "/admin/room-types" },
    { label: "Khách hàng", icon: "bi-people", path: "/admin/customers" },
    { label: "Tài khoản", icon: "bi-person-gear", path: "/admin/accounts" },
    { label: "Thanh toán", icon: "bi-wallet2", path: "/admin/payments" },
    { label: "Khuyến mãi", icon: "bi-ticket-perforated", path: "/admin/promotions" },
    { label: "Đánh giá", icon: "bi-star", path: "/admin/reviews" },
    { label: "Thống kê báo cáo", icon: "bi-bar-chart-line", path: "/admin/reports" },
];

function AdminSidebar({ open, onClose }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("role");
        sessionStorage.removeItem("username");
        navigate("localhost:30000/login");
    };

    return (
        <>
            {open && (
                <div className="admin-sidebar-overlay" onClick={onClose}></div>
            )}

            <aside className={`admin-sidebar ${open ? "show" : ""}`}>
                <div className="admin-brand">
                    <div className="admin-brand-icon">
                        <i className="bi bi-buildings"></i>
                    </div>
                    <div>
                        <h2>GRANDSTAY</h2>
                        <span>HOTEL MANAGEMENT</span>
                    </div>
                    <button className="admin-sidebar-close" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="admin-menu-label">MENU CHÍNH</div>

                <nav className="admin-nav">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === "/admin"}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `admin-nav-link ${isActive ? "active" : ""}`
                            }
                        >
                            <i className={`bi ${item.icon}`}></i>
                            <span>{item.label}</span>
                            {item.path === "/admin" && (
                                <span className="admin-active-indicator"></span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="admin-sidebar-bottom">
                    <div className="admin-sidebar-user">
                        <div className="admin-avatar">
                            <i className="bi bi-person-fill"></i>
                        </div>
                        <div className="admin-user-info">
                            <strong>Administrator</strong>
                            <span>Quản trị viên</span>
                        </div>
                    </div>

                    <button className="admin-logout" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-left"></i>
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default AdminSidebar;
