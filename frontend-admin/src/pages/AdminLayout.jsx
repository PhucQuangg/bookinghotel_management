
import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import {
    AdminPopupProvider
} from "../components/popup/AdminPopupContext";
import "../css/AdminLayout.css";

function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const pageTitles = {
        "/admin": "Tổng quan",
        "/admin/bookings": "Quản lý đặt phòng",
        "/admin/rooms": "Quản lý phòng",
        "/admin/room-types": "Quản lý loại phòng",
        "/admin/customers": "Quản lý khách hàng",
        "/admin/accounts": "Quản lý tài khoản",
        "/admin/payments": "Quản lý thanh toán",
        "/admin/promotions": "Quản lý khuyến mãi",
        "/admin/reviews": "Quản lý đánh giá",
        "/admin/reports": "Thống kê báo cáo",
    };

    const pageTitle = pageTitles[location.pathname] || "Quản trị hệ thống";
    const username = sessionStorage.getItem("username") || "Admin";

    return (
        <AdminPopupProvider>
            <div className="admin-app">
                <AdminSidebar
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                <main className="admin-main">
                    <header className="admin-topbar">
                        <div className="admin-topbar-left">
                            <button
                                className="admin-menu-toggle"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <i className="bi bi-list"></i>
                            </button>

                            <div>
                                <span className="admin-breadcrumb">
                                    GRANDSTAY / ADMIN
                                </span>
                                <h1>{pageTitle}</h1>
                            </div>
                        </div>

                        <div className="admin-topbar-right">
                            <div className="admin-date">
                                <i className="bi bi-calendar3"></i>
                                <span>
                                    {new Intl.DateTimeFormat("vi-VN", {
                                        weekday: "long",
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                    }).format(new Date())}
                                </span>
                            </div>

                            <div className="admin-topbar-divider"></div>

                            <div className="admin-profile">
                                <div className="admin-profile-avatar">
                                    <i className="bi bi-person-fill"></i>
                                </div>
                                <div>
                                    <strong>{username}</strong>
                                    <span>Administrator</span>
                                </div>
                            </div>
                        </div>
                    </header>

                    <section className="admin-page-content">
                        <Outlet />
                    </section>
                </main>
            </div>
        </AdminPopupProvider>
    );
}

export default AdminLayout;
