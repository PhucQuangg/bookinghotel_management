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

            // Đọc dữ liệu phản hồi từ backend
            const data = await response.json().catch(() => ({}));

            // Xử lý lỗi HTTP từ backend
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    "Tên đăng nhập hoặc mật khẩu không chính xác."
                );
            }

            // Điều chỉnh tên field nếu response backend khác
            const token = data.token || data.accessToken;
            const role = String(data.role || "")
                .replace("ROLE_", "")
                .toUpperCase();

            if (!token) {
                setError(
                    "Đăng nhập thành công nhưng không nhận được token."
                );
                return;
            }

            if (role !== "CUSTOMER" && role !== "ADMIN") {
                setError("Tài khoản không có quyền truy cập hợp lệ.");
                return;
            }

            // Lưu token và quyền người dùng
            sessionStorage.setItem("token", token);
            sessionStorage.setItem("role", role);
            sessionStorage.setItem("username", form.username.trim());

            if (data.role === "CUSTOMER") {
        
                window.location.href = "http://localhost:3000";
              } else {
        
                window.location.href = `http://localhost:3001/admin/?token=${
                  data.token
                }&userName=${encodeURIComponent(form.username.trim())}&role=${data.role}`;

                sessionStorage.removeItem("token", token);
                sessionStorage.removeItem("role", role);
                sessionStorage.removeItem("username", form.username.trim());
    
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
