
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Profile.css";

const API_URL = "http://localhost:8080/api/customers/me";

const initialProfile = {
    fullName: "",
    email: "",
    phone: "",
    idCard: "",
    address: "",
};

export default function Profile() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(initialProfile);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            const token = sessionStorage.getItem("token");
            const role = sessionStorage.getItem("role");

            if (!token) {
                navigate("/login");
                return;
            }

            if (role !== "CUSTOMER") {
                setError("Chỉ tài khoản khách hàng mới được sử dụng chức năng này.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(API_URL, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                const data = await response.json().catch(() => ({}));

                if (response.status === 401 || response.status === 403) {
                    setError("Phiên đăng nhập hết hạn hoặc bạn không có quyền truy cập.");
                    setLoading(false);
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        data.message || "Không thể tải thông tin cá nhân."
                    );
                }

                // Hỗ trợ response trả về trực tiếp hoặc bọc trong customer/data
                const customer = data.customer || data.data || data;

                setProfile({
                    fullName: customer.fullName || "",
                    email: customer.email || "",
                    phone: customer.phone || "",
                    idCard: customer.idCard || "",
                    address: customer.address || "",
                });
            } catch (err) {
                setError(
                    err.message || "Không thể kết nối đến máy chủ."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setProfile((prev) => ({
            ...prev,
            [name]: value,
        }));

        setError("");
        setSuccess("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!profile.fullName.trim()) {
            setError("Vui lòng nhập họ và tên.");
            return;
        }

        if (!profile.email.trim()) {
            setError("Vui lòng nhập email.");
            return;
        }

        if (
            profile.phone &&
            !/^[0-9+\s()-]{9,15}$/.test(profile.phone.trim())
        ) {
            setError("Số điện thoại không hợp lệ.");
            return;
        }

        try {
            setSaving(true);

            const token = sessionStorage.getItem("token");

            const response = await fetch(API_URL, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fullName: profile.fullName.trim(),
                    email: profile.email.trim(),
                    phone: profile.phone.trim(),
                    idCard: profile.idCard.trim(),
                    address: profile.address.trim(),
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (response.status === 401 || response.status === 403) {
                throw new Error(
                    "Phiên đăng nhập hết hạn hoặc bạn không có quyền cập nhật."
                );
            }

            if (!response.ok) {
                throw new Error(
                    data.message || "Cập nhật thông tin thất bại."
                );
            }

            const customer = data.customer || data.data || data;

            // Cập nhật dữ liệu hiển thị nếu backend trả về khách hàng
            if (customer.fullName || customer.email) {
                setProfile((prev) => ({
                    ...prev,
                    fullName: customer.fullName ?? prev.fullName,
                    email: customer.email ?? prev.email,
                    phone: customer.phone ?? prev.phone,
                    idCard: customer.idCard ?? prev.idCard,
                    address: customer.address ?? prev.address,
                }));
            }

            setSuccess("Cập nhật thông tin cá nhân thành công.");
        } catch (err) {
            setError(
                err.message || "Không thể kết nối đến máy chủ."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="profile-spinner" />
                <p>Đang tải thông tin cá nhân...</p>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <header className="profile-header">
                <Link to="/" className="profile-brand">
                    <span className="profile-brand-icon">◆</span>
                    <span>
                        GRANDSTAY
                        <small>HOTEL & RESORT</small>
                    </span>
                </Link>

                <Link to="/" className="profile-home-link">
                    ← Quay lại trang chủ
                </Link>
            </header>

            <main className="profile-container">
                <div className="profile-breadcrumb">
                    <Link to="/">Trang chủ</Link>
                    <span>/</span>
                    <span>Thông tin cá nhân</span>
                </div>

                <div className="profile-title">
                    <div>
                        <span className="profile-eyebrow">
                            MY ACCOUNT
                        </span>
                        <h1>Thông tin cá nhân</h1>
                        <p>
                            Quản lý thông tin của bạn để thuận tiện
                            hơn khi đặt phòng tại GrandStay.
                        </p>
                    </div>
                </div>

                <div className="profile-layout">
                    <aside className="profile-sidebar">
                        <div className="profile-avatar">
                            {(profile.fullName || "K")
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <h2>{profile.fullName || "Khách hàng"}</h2>
                        <p>{profile.email || "Chưa cập nhật email"}</p>

                        <div className="profile-sidebar-divider" />

                        <Link
                            to="/profile"
                            className="profile-side-link active"
                        >
                            <span>♙</span>
                            Thông tin cá nhân
                        </Link>

                        <Link
                            to="/booking-history"
                            className="profile-side-link"
                        >
                            <span>▤</span>
                            Lịch sử đặt phòng
                        </Link>

                        <Link
                            to="/my-bookings"
                            className="profile-side-link"
                        >
                            <span>▣</span>
                            Phòng đã đặt
                        </Link>
                    </aside>

                    <section className="profile-card">
                        <div className="profile-card-heading">
                            <div>
                                <h2>Thông tin của bạn</h2>
                                <p>
                                    Vui lòng đảm bảo thông tin luôn chính xác.
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="profile-message error" role="alert">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="profile-message success" role="status">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="profile-form-grid">
                                <div className="profile-field">
                                    <label htmlFor="fullName">
                                        Họ và tên <span>*</span>
                                    </label>
                                    <input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        value={profile.fullName}
                                        onChange={handleChange}
                                        placeholder="Nhập họ và tên"
                                        maxLength={100}
                                        required
                                    />
                                </div>

                                <div className="profile-field">
                                    <label htmlFor="email">
                                        Email <span>*</span>
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={profile.email}
                                        onChange={handleChange}
                                        placeholder="example@email.com"
                                        maxLength={150}
                                        required
                                    />
                                </div>

                                <div className="profile-field">
                                    <label htmlFor="phone">
                                        Số điện thoại <span>*</span>
                                    </label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={profile.phone}
                                        onChange={handleChange}
                                        placeholder="Nhập số điện thoại"
                                        maxLength={15}
                                    />
                                </div>

                                <div className="profile-field">
                                    <label htmlFor="idCard">
                                        Số CCCD / CMND
                                    </label>
                                    <input
                                        id="idCard"
                                        name="idCard"
                                        type="text"
                                        value={profile.idCard}
                                        onChange={handleChange}
                                        placeholder="Nhập số CCCD / CMND"
                                        maxLength={20}
                                    />
                                </div>

                                <div className="profile-field full-width">
                                    <label htmlFor="address">
                                        Địa chỉ
                                    </label>
                                    <textarea
                                        id="address"
                                        name="address"
                                        value={profile.address}
                                        onChange={handleChange}
                                        placeholder="Nhập địa chỉ của bạn"
                                        rows={3}
                                        maxLength={255}
                                    />
                                </div>
                            </div>

                            <div className="profile-form-footer">
                                <span>
                                    Các mục có dấu * là bắt buộc.
                                </span>

                                <button
                                    type="submit"
                                    className="profile-save-btn"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Đang lưu..."
                                        : "Lưu thay đổi"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </main>

            <footer className="profile-footer">
                © 2026 GrandStay Hotel. All rights reserved.
            </footer>
        </div>
    );
}