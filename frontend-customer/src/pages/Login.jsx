import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/Auth.css";

const API_URL = "http://localhost:8080/api/auth";

export default function Login() {

    const [form, setForm] = useState({
        username: "",
        password: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });

        setError("");
    };

    
const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.username.trim() || !form.password) {
        setError("Vui lòng nhập đầy đủ thông tin.");
        return;
    }

    try {
        setLoading(true);

        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: form.username.trim(),
                password: form.password,
            }),
        });

        // Đọc nội dung phản hồi từ Backend
        const data = await response.json().catch(() => ({}));

        // Xử lý lỗi đăng nhập
        if (!response.ok) {
            const errorMessage =
                data.detail ||
                data.message ||
                data.error ||
                (response.status === 403
                    ? "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ khách sạn để được hỗ trợ."
                    : response.status === 401
                        ? "Tên đăng nhập hoặc mật khẩu không chính xác."
                        : "Đã xảy ra lỗi. Vui lòng thử lại.");

            throw new Error(errorMessage);
        }

        // Lấy thông tin đăng nhập
        const token = data.token || data.accessToken;

        const role = String(data.role || "")
            .replace("ROLE_", "")
            .toUpperCase();

        if (!token) {
            throw new Error(
                "Đăng nhập thành công nhưng không nhận được token."
            );
        }

        if (role !== "CUSTOMER" && role !== "ADMIN") {
            throw new Error("Tài khoản không có quyền truy cập hợp lệ.");
        }

        // Đăng nhập khách hàng
        if (role === "CUSTOMER") {
            sessionStorage.setItem("token", token);
            sessionStorage.setItem("role", role);
            sessionStorage.setItem("username", data.username || form.username.trim());

            window.location.href = "http://localhost:3000";
            return;
        }

        // Đăng nhập quản trị viên
        if (role === "ADMIN") {
            const username = data.username || form.username.trim();

            // Truyền token và thông tin tài khoản sang trang Admin
            const adminUrl = new URL("http://localhost:3001/admin/");

            adminUrl.searchParams.set("token", token);
            adminUrl.searchParams.set("userName", username);
            adminUrl.searchParams.set("role", role);

            window.location.href = adminUrl.toString();
            return;
        }

    } catch (err) {
        setError(
            err.message ||
            "Không thể kết nối đến máy chủ. Vui lòng thử lại."
        );
    } finally {
        setLoading(false);
    }
};


    return (
        <div className="auth-page">
            <div className="auth-visual">
                <Link to="/" className="auth-brand">
                    <span className="auth-brand-icon">◆</span>
                    <span>
                        GRANDSTAY
                        <small>HOTEL & RESORT</small>
                    </span>
                </Link>

                <div className="auth-visual-content">
                    <span className="auth-eyebrow">
                        WELCOME BACK
                    </span>

                    <h1>
                        Hành trình của bạn
                        <br />
                        bắt đầu từ đây.
                    </h1>

                    <p>
                        Đăng nhập để quản lý đặt phòng,
                        theo dõi lịch sử và tận hưởng kỳ nghỉ
                        theo cách của riêng bạn.
                    </p>
                </div>

                <div className="auth-visual-footer">
                    Your comfort, our priority.
                </div>
            </div>

            <div className="auth-form-side">
                <div className="auth-form-container">
                    <Link to="/" className="auth-back-home">
                        ← Quay lại trang chủ
                    </Link>

                    <div className="auth-heading">
                        <span className="auth-eyebrow">
                            YOUR ACCOUNT
                        </span>

                        <h2>Chào mừng trở lại!</h2>

                        <p>
                            Đăng nhập vào tài khoản GrandStay
                            của bạn.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="auth-field">
                            <label htmlFor="username">
                                Tên đăng nhập
                            </label>

                            <input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="Nhập tên đăng nhập"
                                value={form.username}
                                onChange={handleChange}
                                autoComplete="username"
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="password">
                                Mật khẩu
                            </label>

                            <div className="auth-password-wrap">
                                <input
                                    id="password"
                                    name="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Nhập mật khẩu"
                                    value={form.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="auth-password-toggle"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                >
                                    {showPassword ? "Ẩn" : "Hiện"}
                                </button>
                            </div>
                        </div>

                        <div className="auth-form-options">
                            <label className="auth-checkbox">
                                <input type="checkbox" />
                                <span>Ghi nhớ trên thiết bị này</span>
                            </label>

                            <Link to="/forgot-password">
                                Quên mật khẩu?
                            </Link>
                        </div>

                        {error && (
                            <div className="auth-error" role="alert">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Đang đăng nhập..."
                                : "ĐĂNG NHẬP"}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>CHƯA CÓ TÀI KHOẢN?</span>
                    </div>

                    <Link
                        to="/register"
                        className="auth-secondary-button"
                    >
                        Tạo tài khoản mới
                    </Link>

                    <p className="auth-terms">
                        Bằng việc tiếp tục, bạn đồng ý với
                        các điều khoản sử dụng của GrandStay.
                    </p>
                </div>
            </div>
        </div>
    );
}
