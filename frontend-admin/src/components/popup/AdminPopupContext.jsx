
import React, {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
} from "react";
import "./AdminPopup.css";

const AdminPopupContext = createContext(null);

export function AdminPopupProvider({ children }) {
    const [popup, setPopup] = useState(null);
    const [toast, setToast] = useState(null);

    const confirmResolver = useRef(null);
    const toastTimer = useRef(null);

    // Mở popup thông báo
    const showMessage = useCallback((type, message, title) => {
        setPopup({
            mode: "message",
            type,
            title: title || (
                type === "success" ? "Thành công" :
                type === "error" ? "Đã xảy ra lỗi" :
                type === "warning" ? "Cảnh báo" : "Thông báo"
            ),
            message,
        });
    }, []);

    const success = useCallback((message, title) => {
        showMessage("success", message, title);
    }, [showMessage]);

    const error = useCallback((message, title) => {
        showMessage("error", message, title);
    }, [showMessage]);

    const warning = useCallback((message, title) => {
        showMessage("warning", message, title);
    }, [showMessage]);

    const info = useCallback((message, title) => {
        showMessage("info", message, title);
    }, [showMessage]);

    // Popup xác nhận
    const confirm = useCallback((options = {}) => {
        // Nếu đang có popup xác nhận, giải quyết popup cũ là false
        if (confirmResolver.current) {
            confirmResolver.current(false);
        }

        setPopup({
            mode: "confirm",
            type: options.danger ? "danger" : "confirm",
            title: options.title || "Xác nhận thao tác",
            message: options.message || "Bạn có chắc chắn muốn thực hiện thao tác này?",
            confirmText: options.confirmText || "Xác nhận",
            cancelText: options.cancelText || "Quay lại",
            danger: Boolean(options.danger),
        });

        return new Promise((resolve) => {
            confirmResolver.current = resolve;
        });
    }, []);
    const choose = useCallback((options = {}) => {
        if (confirmResolver.current) {
            confirmResolver.current(null);
        }
    
        setPopup({
            mode: "select",
            type: "info",
            title: options.title || "Chọn trạng thái",
            message: options.message || "Vui lòng chọn trạng thái muốn cập nhật.",
            choices: options.choices || [],
            cancelText: options.cancelText || "Quay lại",
        });
    
        return new Promise((resolve) => {
            confirmResolver.current = resolve;
        });
    }, []);

    const closePopup = useCallback((result = false) => {
        if (confirmResolver.current) {
            confirmResolver.current(result);
            confirmResolver.current = null;
        }

        setPopup(null);
    }, []);

    // Toast thông báo nhanh
    const showToast = useCallback((message, type = "success") => {
        if (toastTimer.current) {
            clearTimeout(toastTimer.current);
        }

        setToast({ message, type });

        toastTimer.current = setTimeout(() => {
            setToast(null);
            toastTimer.current = null;
        }, 3500);
    }, []);

    const toastSuccess = useCallback((message) => {
        showToast(message, "success");
    }, [showToast]);

    const toastError = useCallback((message) => {
        showToast(message, "error");
    }, [showToast]);

    const toastWarning = useCallback((message) => {
        showToast(message, "warning");
    }, [showToast]);

    const value = {
        success,
        error,
        warning,
        info,
        confirm,
        choose,
        toastSuccess,
        toastError,
        toastWarning,
    };

    const icons = {
        success: "bi-check-circle-fill",
        error: "bi-x-circle-fill",
        warning: "bi-exclamation-triangle-fill",
        info: "bi-info-circle-fill",
        confirm: "bi-question-circle-fill",
        danger: "bi-exclamation-circle-fill",
    };

    return (
        <AdminPopupContext.Provider value={value}>
            {children}

            {/* POPUP */}
            {popup && (
                <div
                    className="admin-popup-backdrop"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            closePopup(false);
                        }
                    }}
                >
                    <div
                        className="admin-popup-modal"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className={`admin-popup-icon ${popup.type}`}>
                            <i className={`bi ${icons[popup.type]}`} />
                        </div>

                        <h3>{popup.title}</h3>

                        <p>{popup.message}</p>

                        {popup.mode === "confirm" ? (
                            <div className="admin-popup-actions">
                                <button
                                    type="button"
                                    className="admin-popup-btn cancel"
                                    onClick={() => closePopup(false)}
                                >
                                    {popup.cancelText}
                                </button>

                                <button
                                    type="button"
                                    className={`admin-popup-btn ${
                                        popup.danger ? "danger" : "primary"
                                    }`}
                                    onClick={() => closePopup(true)}
                                >
                                    {popup.confirmText}
                                </button>
                            </div>
                        ) : (
                            <div className="admin-popup-actions">
                                <button
                                    type="button"
                                    className="admin-popup-btn primary"
                                    onClick={() => closePopup(true)}
                                >
                                    Đóng
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TOAST */}
            {toast && (
                <div className={`admin-toast ${toast.type}`}>
                    <i className={`bi ${icons[toast.type]}`} />

                    <span>{toast.message}</span>

                    <button
                        type="button"
                        aria-label="Đóng thông báo"
                        onClick={() => {
                            if (toastTimer.current) {
                                clearTimeout(toastTimer.current);
                                toastTimer.current = null;
                            }
                            setToast(null);
                        }}
                    >
                        <i className="bi bi-x" />
                    </button>
                </div>
            )}
        </AdminPopupContext.Provider>
    );
}

export function useAdminPopup() {
    const context = useContext(AdminPopupContext);

    if (!context) {
        throw new Error(
            "useAdminPopup phải được sử dụng bên trong AdminPopupProvider"
        );
    }

    return context;
}
