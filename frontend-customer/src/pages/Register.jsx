
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Auth.css";

const API_URL = "http://localhost:8080/api/auth";

export default function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        email: "",
        phone: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });

        setError("");
        setSuccess("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (
            !form.username.trim() ||
            !form.password ||
            !form.fullName.trim() ||
            !form.email.trim() ||
            !form.phone.trim()
        ) {
            setError("Vui lòng điền đầy đủ thông tin.");
            return;
        }

        if (form.username.trim().length < 4) {
            setError("Tên đăng nhập cần ít nhất 4 ký tự.");
            return;
        }

        if (form.password.length < 8) {
            setError("Mật khẩu cần ít nhất 8 ký tự.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Mật khẩu xác nhận không khớp.");
            return;
        }

        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            form.email.trim()
        );

        if (!emailValid) {
            setError("Email không hợp lệ.");
            return;
        }

        if (!/^[0-9+\s()-]{9,20}$/.test(form.phone.trim())) {
            setError("Số điện thoại không hợp lệ.");
            return;
        }

        try {
            setLoading(true);

            await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: form.username.trim(),
                    password: form.password,
                    fullName: form.fullName.trim(),
                    email: form.email.trim(),
                    phone: form.phone.trim(),
                }),
            });

            setSuccess(
                "Đăng ký thành công! Đang chuyển đến trang đăng nhập..."
            );

            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 1200);
        } catch (err) {
            const message = err.response?.data?.message;

            setError(
                message ||
                "Đăng ký chưa thành công. Vui lòng kiểm tra thông tin."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page auth-register-page">
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
                        JOIN GRANDSTAY
                    </span>

                    <h1>
                        Mỗi chuyến đi
                        <br />
                        một trải nghiệm
                        <br />
                        đáng nhớ.
                    </h1>

                    <p>
                        Tạo tài khoản để dễ dàng đặt phòng,
                        theo dõi lịch trình và quản lý những
                        kỳ nghỉ của bạn.
                    </p>
                </div>

                <div className="auth-visual-footer">
                    Your next journey starts here.
                </div>
            </div>

            <div className="auth-form-side">
                <div className="auth-form-container auth-register-container">
                    <Link to="/" className="auth-back-home">
                        ← Quay lại trang chủ
                    </Link>

                    <div className="auth-heading">
                        <span className="auth-eyebrow">
                            CREATE ACCOUNT
                        </span>

                        <h2>Tạo tài khoản</h2>

                        <p>
                            Điền thông tin để bắt đầu đặt phòng
                            tại GrandStay.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="auth-field">
                            <label htmlFor="fullName">
                                Họ và tên
                            </label>

                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                placeholder="Nguyễn Văn A"
                                value={form.fullName}
                                onChange={handleChange}
                                autoComplete="name"
                                maxLength={100}
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="regUsername">
                                Tên đăng nhập
                            </label>

                            <input
                                id="regUsername"
                                name="username"
                                type="text"
                                placeholder="Tạo tên đăng nhập"
                                value={form.username}
                                onChange={handleChange}
                                autoComplete="username"
                                minLength={4}
                                maxLength={50}
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="email">
                                Email
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="example@email.com"
                                value={form.email}
                                onChange={handleChange}
                                autoComplete="email"
                                maxLength={100}
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="phone">
                                Số điện thoại
                            </label>

                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="Nhập số điện thoại"
                                value={form.phone}
                                onChange={handleChange}
                                autoComplete="tel"
                                maxLength={20}
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="regPassword">
                                Mật khẩu
                            </label>

                            <div className="auth-password-wrap">
                                <input
                                    id="regPassword"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Ít nhất 8 ký tự"
                                    value={form.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    minLength={8}
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

                        <div className="auth-field">
                            <label htmlFor="confirmPassword">
                                Xác nhận mật khẩu
                            </label>

                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="Nhập lại mật khẩu"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                autoComplete="new-password"
                                required
                            />
                        </div>

              

                        {error && (
                            <div className="auth-error" role="alert">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="auth-success" role="status">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? "Đang tạo tài khoản..." : "ĐĂNG KÝ"}
                        </button>
                    </form>

                    <div className="auth-bottom-text">
                        Đã có tài khoản?{" "}
                        <Link to="/login">
                            Đăng nhập ngay
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}