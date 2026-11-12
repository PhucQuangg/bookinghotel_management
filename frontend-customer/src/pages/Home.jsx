
import React, { useEffect, useState } from "react";
import "../css/Home.css";
import "../css/RoomFilter.css";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8080/api";

// Giữ nguyên các link hình ảnh phòng có sẵn
const getRoomImage = (room) => {
    const typeName = (room.roomTypeName || "").toLowerCase();

    if (typeName.includes("family")) {
        return "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80";
    }

    if (typeName.includes("deluxe")) {
        return "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80";
    }

    return "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=80";
};

const formatPrice = (price) => {
    return (
        new Intl.NumberFormat("vi-VN").format(Number(price) || 0) + "đ"
    );
};

function Home() {
    const navigate = useNavigate();

    // ================= AUTH =================
    const [username, setUsername] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // ================= ROOM DATA =================
    const [rooms, setRooms] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);

    const [isLoadingRooms, setIsLoadingRooms] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // ================= SEARCH =================
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [guests, setGuests] = useState(2);

    // ================= FILTER =================
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [selectedRoomType, setSelectedRoomType] = useState("");
    const [minCapacity, setMinCapacity] = useState("");

    // ================= NOTIFICATION =================
    const [toast, setToast] = useState("");

    const today = new Date().toLocaleDateString("en-CA");

    // ================= LOGIN STATE =================
    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const savedUsername = sessionStorage.getItem("username");

        if (token) {
            setIsLoggedIn(true);
            setUsername(savedUsername || "Khách hàng");
        } else {
            setIsLoggedIn(false);
            setUsername("");
        }
    }, []);

    // ================= TOAST TIMER =================
    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => {
            setToast("");
        }, 3000);

        return () => clearTimeout(timer);
    }, [toast]);

    // ================= LOAD ALL ROOMS =================
    // Mở trang chủ: GET /api/rooms
    useEffect(() => {
        const fetchAllRooms = async () => {
            setIsLoadingRooms(true);

            try {
                const response = await fetch(`${API_URL}/customers/rooms`);

                if (!response.ok) {
                    const message = await response.text();

                    throw new Error(
                        message || `Lỗi HTTP ${response.status}`
                    );
                }

                const data = await response.json();

                setRooms(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Load rooms error:", error);
                setRooms([]);
                setToast(
                    error.message || "Không thể tải danh sách phòng."
                );
            } finally {
                setIsLoadingRooms(false);
            }
        };

        fetchAllRooms();
    }, []);

    // ================= LOGOUT =================
    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("role");
        sessionStorage.removeItem("username");

        setIsLoggedIn(false);
        setUsername("");
        setShowUserMenu(false);

        navigate("/");
    };

    // ================= SEARCH AVAILABLE ROOMS =================
    // GET /api/rooms/available
    const handleSearchRoom = async () => {
        if (!checkIn || !checkOut) {
            setToast("Vui lòng chọn ngày nhận và trả phòng.");
            return;
        }

        if (checkIn < today) {
            setToast("Ngày nhận phòng không được ở trong quá khứ.");
            return;
        }

        if (checkOut <= checkIn) {
            setToast("Ngày trả phòng phải sau ngày nhận phòng.");
            return;
        }

        if (!guests || guests < 1) {
            setToast("Vui lòng chọn số khách hợp lệ.");
            return;
        }

        setIsSearching(true);
        setHasSearched(true);
        setAvailableRooms([]);

        try {
            const params = new URLSearchParams({
                checkInDate: checkIn,
                checkOutDate: checkOut,
                guestCount: String(guests),
            });

            const response = await fetch(
                `${API_URL}/customers/rooms/available?${params.toString()}`
            );

            if (!response.ok) {
                const message = await response.text();

                console.error("API status:", response.status);
                console.error("API error response:", message);

                throw new Error(
                    message || `API lỗi HTTP ${response.status}`
                );
            }

            const data = await response.json();

            const result = Array.isArray(data) ? data : [];

            setAvailableRooms(result);

            if (result.length === 0) {
                setToast(
                    "Không tìm thấy phòng phù hợp với ngày và số khách đã chọn."
                );
            } else {
                setToast(`Tìm thấy ${result.length} phòng phù hợp.`);
            }

            setTimeout(() => {
                document.getElementById("rooms")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }, 100);
        } catch (error) {
            console.error("Search room error:", error);

            setAvailableRooms([]);
            setToast(
                error.message || "Không thể kết nối đến máy chủ."
            );
        } finally {
            setIsSearching(false);
        }
    };

    // ================= RESET SEARCH =================
    const handleResetSearch = () => {
        setCheckIn("");
        setCheckOut("");
        setGuests(2);
        setHasSearched(false);
        setAvailableRooms([]);
    };

    // ================= VIEW ROOM =================
    const handleViewRoom = (room) => {
        navigate("/rooms", {
            state: {
                room,
                checkIn: checkIn || "",
                checkOut: checkOut || "",
                guests: Number(guests) || 2,
            },
        });
    };

    // ================= FILTER ROOMS =================
    // Chưa tìm theo ngày: lọc trên danh sách /api/rooms
    // Đã tìm theo ngày: lọc trên danh sách /api/rooms/available
    const sourceRooms = hasSearched ? availableRooms : rooms;

    const filteredRooms = sourceRooms.filter((room) => {
        const price = Number(room.basePrice ?? 0);
        const capacity = Number(room.capacity ?? 0);
        const roomName = room.roomTypeName ?? "";

        const matchesMinPrice =
            minPrice === "" || price >= Number(minPrice);

        const matchesMaxPrice =
            maxPrice === "" || price <= Number(maxPrice);

        const matchesRoomType =
            selectedRoomType === "" ||
            roomName === selectedRoomType;

        const matchesCapacity =
            minCapacity === "" ||
            capacity >= Number(minCapacity);

        return (
            matchesMinPrice &&
            matchesMaxPrice &&
            matchesRoomType &&
            matchesCapacity
        );
    });

    // Danh sách loại phòng lấy từ dữ liệu API hiện tại
    const roomTypes = [
        ...new Set(
            sourceRooms
                .map((room) => room.roomTypeName)
                .filter(Boolean)
        ),
    ];

    // ================= RENDER =================
    return (
        <div className="home-page">
            {/* ================= HEADER ================= */}
            <header className="home-header">
                <div className="home-container home-navbar">
                    <a href="/" className="home-logo">
                        <div className="home-logo-icon">◆</div>

                        <div className="home-logo-text">
                            GRANDSTAY
                            <span>HOTEL &amp; RESORT</span>
                        </div>
                    </a>

                    <nav className="home-nav">
                        <a href="/" className="active">
                            Trang chủ
                        </a>
                        <a href="#rooms">Phòng</a>
                        <a href="#promotion">Khuyến mãi</a>
                        <a href="#about">Giới thiệu</a>
                        <a href="#contact">Liên hệ</a>
                    </nav>

                    <div className="home-auth">
                        {isLoggedIn ? (
                            <div className="user-menu">
                                <span className="user-name">
                                    Xin chào, <strong>{username}</strong>
                                </span>

                                <button
                                    type="button"
                                    className="user-menu-toggle"
                                    aria-label="Mở menu tài khoản"
                                    aria-expanded={showUserMenu}
                                    onClick={() =>
                                        setShowUserMenu(!showUserMenu)
                                    }
                                >
                                    ☰
                                </button>

                                {showUserMenu && (
                                    <div className="user-dropdown">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                navigate("/profile");
                                            }}
                                        >
                                            <span>♙</span>
                                            Thông tin cá nhân
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                navigate("/booking-history");
                                            }}
                                        >
                                            <span>▤</span>
                                            Lịch sử đặt phòng
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                navigate("/payment-history")
                                            }}
                                        >
                                            <span>▣</span>
                                            Lịch sử thanh toán
                                        </button>

                                        <div className="user-dropdown-divider" />

                                        <button
                                            type="button"
                                            className="user-logout"
                                            onClick={handleLogout}
                                        >
                                            <span>↪</span>
                                            Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="home-login-btn"
                                    onClick={() => navigate("/login")}
                                >
                                    Đăng nhập
                                </button>

                                <button
                                    type="button"
                                    className="home-register-btn"
                                    onClick={() => navigate("/register")}
                                >
                                    Đăng ký
                                </button>
                            </>
                        )}
                    </div>

                    <button
                        type="button"
                        className="home-mobile-menu"
                        onClick={() =>
                            setShowUserMenu(!showUserMenu)
                        }
                    >
                        ☰
                    </button>
                </div>
            </header>

            {/* ================= HERO ================= */}
            <section className="home-hero">
                <div className="home-hero-content">
                    <div className="home-hero-small-title">
                        Welcome to GrandStay
                    </div>

                    <h1>
                        Nơi mỗi kỳ nghỉ
                        <br />
                        trở thành một
                        <br />
                        kỷ niệm đáng nhớ.
                    </h1>

                    <p>
                        Khám phá không gian nghỉ dưỡng tiện nghi,
                        dịch vụ chuyên nghiệp và những căn phòng
                        được thiết kế dành riêng cho sự thoải mái của bạn.
                    </p>

                    {/* ================= SEARCH ================= */}
                    <div className="home-search-box">
                        <div className="home-search-item">
                            <label>Nhận phòng</label>
                            <input
                                type="date"
                                value={checkIn}
                                min={today}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setCheckIn(value);

                                    if (checkOut && checkOut <= value) {
                                        setCheckOut("");
                                    }
                                }}
                            />
                        </div>

                        <div className="home-search-item">
                            <label>Trả phòng</label>
                            <input
                                type="date"
                                value={checkOut}
                                min={checkIn || today}
                                onChange={(e) =>
                                    setCheckOut(e.target.value)
                                }
                            />
                        </div>

                        <div className="home-search-item">
                            <label>Số khách</label>
                            <select
                                value={guests}
                                onChange={(e) =>
                                    setGuests(Number(e.target.value))
                                }
                            >
                                {[1, 2, 3, 4, 5, 6].map((number) => (
                                    <option key={number} value={number}>
                                        {number} khách
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            className="home-search-btn"
                            onClick={handleSearchRoom}
                            disabled={isSearching}
                        >
                            <span>⌕</span>
                            {isSearching ? "ĐANG TÌM..." : "TÌM PHÒNG"}
                        </button>
                    </div>
                </div>
            </section>

            {/* ================= ROOMS ================= */}
            <section
                className="home-section home-rooms-section"
                id="rooms"
            >
                <div className="home-container">
                    <div className="home-section-header">
                        <div className="home-section-subtitle">
                            Accommodation
                        </div>

                        <h2>
                            {hasSearched
                                ? "Kết quả tìm phòng"
                                : "Phòng nổi bật"}
                        </h2>

                        <p>
                            {hasSearched
                                ? `Ngày ${checkIn} đến ${checkOut} · ${guests} khách`
                                : "Lựa chọn không gian nghỉ dưỡng phù hợp với nhu cầu và ngân sách của bạn."}
                        </p>

                        {hasSearched && (
                            <button
                                type="button"
                                className="room-filter-clear"
                                onClick={handleResetSearch}
                            >
                                Xem tất cả phòng
                            </button>
                        )}
                    </div>

                    {/* ================= FILTER ================= */}
                    <div className="room-filter-panel">
                        <div className="room-filter-heading">
                            <div>
                                <h3>Lọc phòng</h3>
                                <p>
                                    Thu hẹp lựa chọn theo ngân sách,
                                    loại phòng và số khách.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="room-filter-clear"
                                onClick={() => {
                                    setMinPrice("");
                                    setMaxPrice("");
                                    setSelectedRoomType("");
                                    setMinCapacity("");
                                }}
                            >
                                Xóa bộ lọc
                            </button>
                        </div>

                        <div className="room-filter-grid">
                            <div className="room-filter-item">
                                <label htmlFor="filter-min-price">
                                    Giá tối thiểu / đêm
                                </label>
                                <input
                                    id="filter-min-price"
                                    type="number"
                                    min="0"
                                    placeholder="Ví dụ: 500000"
                                    value={minPrice}
                                    onChange={(e) =>
                                        setMinPrice(e.target.value)
                                    }
                                />
                            </div>

                            <div className="room-filter-item">
                                <label htmlFor="filter-max-price">
                                    Giá tối đa / đêm
                                </label>
                                <input
                                    id="filter-max-price"
                                    type="number"
                                    min="0"
                                    placeholder="Ví dụ: 2000000"
                                    value={maxPrice}
                                    onChange={(e) =>
                                        setMaxPrice(e.target.value)
                                    }
                                />
                            </div>

                            <div className="room-filter-item">
                                <label htmlFor="filter-room-type">
                                    Loại phòng
                                </label>
                                <select
                                    id="filter-room-type"
                                    value={selectedRoomType}
                                    onChange={(e) =>
                                        setSelectedRoomType(e.target.value)
                                    }
                                >
                                    <option value="">
                                        Tất cả loại phòng
                                    </option>

                                    {roomTypes.map((name) => (
                                        <option key={name} value={name}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="room-filter-item">
                                <label htmlFor="filter-capacity">
                                    Sức chứa tối thiểu
                                </label>
                                <select
                                    id="filter-capacity"
                                    value={minCapacity}
                                    onChange={(e) =>
                                        setMinCapacity(e.target.value)
                                    }
                                >
                                    <option value="">
                                        Tất cả sức chứa
                                    </option>
                                    {[1, 2, 3, 4, 5, 6].map((number) => (
                                        <option
                                            key={number}
                                            value={number}
                                        >
                                            Từ {number} khách
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <p className="room-filter-result">
                            Hiển thị{" "}
                            <strong>{filteredRooms.length}</strong> /{" "}
                            <strong>{sourceRooms.length}</strong> phòng
                        </p>
                    </div>

                    {/* ================= ROOM LIST ================= */}
                    <div className="home-rooms-grid">
                        {isLoadingRooms && !hasSearched && (
                            <p>Đang tải danh sách phòng...</p>
                        )}

                        {isSearching && (
                            <p>Đang tìm phòng phù hợp...</p>
                        )}

                        {!isLoadingRooms &&
                            !isSearching &&
                            filteredRooms.map((room) => {
                                const roomName =
                                    room.roomTypeName || "Phòng nghỉ";
                                const image = getRoomImage(room);
                                const description =
                                    room.roomDescription ||
                                    room.roomTypeDescription ||
                                    "Phòng nghỉ tiện nghi, thoải mái.";

                                return (
                                    <div
                                        className="home-room-card"
                                        key={room.roomId}
                                    >
                                        <div className="home-room-image">
                                            <img
                                                src={image}
                                                alt={roomName}
                                            />
                                        </div>

                                        <div className="home-room-content">
                                            <h3>
                                                {roomName}
                                                <span>
                                                    {" "} - Phòng{" "}
                                                    {room.roomNumber}
                                                </span>
                                            </h3>

                                            <p className="home-room-description">
                                                {description}
                                            </p>

                                            <div className="home-room-info">
                                                <span>
                                                    👤 {room.capacity} khách
                                                </span>
                                                <span>
                                                    ◇ {room.area ?? "—"} m²
                                                </span>
                                                <span>
                                                    🛏 {room.bedType || "—"}
                                                </span>
                                            </div>

                                            <div className="home-room-bottom">
                                                <div className="home-room-price">
                                                    {formatPrice(
                                                        room.basePrice
                                                    )}
                                                    <span>/ đêm</span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleViewRoom(room)
                                                    }
                                                >
                                                    Xem phòng →
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                        {!isLoadingRooms &&
                            !isSearching &&
                            filteredRooms.length === 0 && (
                                <p className="room-filter-empty">
                                    {hasSearched
                                        ? "Không tìm thấy phòng trống phù hợp với ngày và điều kiện đã chọn."
                                        : rooms.length === 0
                                          ? "Chưa có dữ liệu phòng. Vui lòng kiểm tra database hoặc API."
                                          : "Không tìm thấy phòng phù hợp với điều kiện đã chọn. Vui lòng điều chỉnh bộ lọc."}
                                </p>
                            )}
                    </div>
                </div>
            </section>

            {/* ================= PROMOTION ================= */}
            <section
                className="home-section home-promotion-section"
                id="promotion"
            >
                <div className="home-container">
                    <div className="home-promotion">
                        <div className="home-promotion-content">
                            <div className="home-promotion-label">
                                Special Offer
                            </div>

                            <h2>
                                Ưu đãi đặc biệt
                                <br />
                                dành cho kỳ nghỉ của bạn
                            </h2>

                            <p>
                                Đặt phòng trực tuyến ngay hôm nay
                                và tận hưởng những ưu đãi hấp dẫn
                                từ GrandStay Hotel.
                            </p>

                            <a href="#rooms">XEM PHÒNG NGAY</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= FEATURES ================= */}
            <section className="home-section">
                <div className="home-container">
                    <div className="home-section-header">
                        <div className="home-section-subtitle">
                            Our Advantages
                        </div>

                        <h2>Vì sao chọn GrandStay?</h2>

                        <p>
                            Trải nghiệm đặt phòng đơn giản,
                            thuận tiện và đáng tin cậy.
                        </p>
                    </div>

                    <div className="home-features-grid">
                        <div className="home-feature-card">
                            <div className="home-feature-icon">🛏</div>
                            <h3>Phòng tiện nghi</h3>
                            <p>
                                Không gian sạch sẽ, hiện đại
                                và đầy đủ tiện nghi.
                            </p>
                        </div>

                        <div className="home-feature-card">
                            <div className="home-feature-icon">🔒</div>
                            <h3>Đặt phòng an toàn</h3>
                            <p>
                                Thông tin đặt phòng được
                                bảo mật và quản lý an toàn.
                            </p>
                        </div>

                        <div className="home-feature-card">
                            <div className="home-feature-icon">💰</div>
                            <h3>Giá hợp lý</h3>
                            <p>
                                Nhiều lựa chọn phòng phù hợp
                                với ngân sách của bạn.
                            </p>
                        </div>

                        <div className="home-feature-card">
                            <div className="home-feature-icon">☎</div>
                            <h3>Hỗ trợ tận tâm</h3>
                            <p>
                                Luôn sẵn sàng hỗ trợ khách hàng
                                trong quá trình đặt phòng.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= ABOUT ================= */}
            <section
                className="home-section home-about-section"
                id="about"
            >
                <div className="home-container home-about-grid">
                    <div className="home-about-image">
                        <img
                            src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80"
                            alt="GrandStay Hotel"
                        />
                    </div>

                    <div className="home-about-content">
                        <div className="home-section-subtitle">
                            About GrandStay
                        </div>

                        <h2>
                            Một không gian dành cho những khoảnh khắc
                            đáng nhớ.
                        </h2>

                        <p>
                            GrandStay Hotel mang đến không gian
                            nghỉ dưỡng hiện đại, thoải mái và phù hợp
                            cho cả những chuyến công tác ngắn ngày
                            lẫn kỳ nghỉ cùng gia đình.
                        </p>

                        <p>
                            Với hệ thống đặt phòng trực tuyến đơn giản,
                            khách hàng có thể dễ dàng tìm kiếm phòng,
                            lựa chọn ngày lưu trú và hoàn tất đặt phòng
                            chỉ với vài bước.
                        </p>

                        <ul>
                            <li>
                                <span>✓</span> Không gian nghỉ dưỡng hiện đại
                            </li>
                            <li>
                                <span>✓</span> Nhiều loại phòng phù hợp
                            </li>
                            <li>
                                <span>✓</span> Đặt phòng trực tuyến nhanh chóng
                            </li>
                            <li>
                                <span>✓</span> Hỗ trợ khách hàng tận tình
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* ================= CTA ================= */}
            <section className="home-cta">
                <div className="home-container">
                    <h2>Sẵn sàng cho kỳ nghỉ tiếp theo?</h2>

                    <p>
                        Tìm căn phòng phù hợp và bắt đầu hành trình của bạn.
                    </p>

                    <a href="#rooms">KHÁM PHÁ PHÒNG</a>
                </div>
            </section>

            {/* ================= FOOTER ================= */}
            <footer className="home-footer" id="contact">
                <div className="home-container">
                    <div className="home-footer-grid">
                        <div>
                            <div className="home-footer-logo">
                                GRANDSTAY
                            </div>

                            <p>
                                Hệ thống quản lý khách sạn và đặt phòng
                                trực tuyến, mang đến trải nghiệm đặt phòng
                                nhanh chóng và thuận tiện.
                            </p>
                        </div>

                        <div>
                            <h3>Khám phá</h3>
                            <a href="/">Trang chủ</a>
                            <a href="#rooms">Phòng</a>
                            <a href="#promotion">Khuyến mãi</a>
                            <a href="#about">Giới thiệu</a>
                        </div>

                        <div>
                            <h3>Hỗ trợ</h3>
                            <a href="#contact">Chính sách đặt phòng</a>
                            <a href="#contact">Điều khoản sử dụng</a>
                            <a href="#contact">Chính sách bảo mật</a>
                            <a href="#contact">Câu hỏi thường gặp</a>
                        </div>

                        <div>
                            <h3>Liên hệ</h3>
                            <p>📍 123 Nguyễn Văn A, TP. Hồ Chí Minh</p>
                            <p>☎ 0901 234 567</p>
                            <p>✉ contact@grandstay.vn</p>
                        </div>
                    </div>

                    <div className="home-footer-bottom">
                        © 2026 GrandStay Hotel. All rights reserved.
                    </div>
                </div>
            </footer>

            {/* ================= TOAST ================= */}
            {toast && (
                <div className="home-toast">
                    {toast}
                </div>
            )}
        </div>
    );
}

export default Home;
