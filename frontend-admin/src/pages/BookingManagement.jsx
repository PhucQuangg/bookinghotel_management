import React, { useState, useEffect, useCallback } from "react";
import "../css/BookingManagement.css";
import { useAdminPopup } from "../components/popup/AdminPopupContext";

const API_URL = "http://localhost:8080/api/admin/bookings";
const API_URL_ROOMS = "http://localhost:8080/api/admin/rooms";

const PAGE_SIZE = 8;
const formatCurrencyInput = (value) => {
  if (!value) return "";

  return String(value)
    .replace(/\D/g, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
const STATUS_LABELS = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  CHECKED_IN: "Đang lưu trú",
  COMPLETED: "Đã hoàn thành",
  CANCELED: "Đã hủy",
};

const PAYMENT_STATUS_LABELS = {
  PENDING: "Chờ thanh toán",
  PARTIALLY_PAID: "Đã đặt cọc",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  REFUNDED: "Đã hoàn tiền",
};

const formatMoney = (amount) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount || 0);

const formatDate = (date) => {
  if (!date) return "--";

  const value = new Date(date + "T00:00:00");

  return Number.isNaN(value.getTime())
    ? date
    : value.toLocaleDateString("vi-VN");
};

const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString("vi-VN") : "--";

const getStatusClass = (status) =>
  `booking-status status-${(status || "").toLowerCase()}`;

const getSourceLabel = (source) => {
  const value = (source || "WEB").toUpperCase();
  return value === "CUSTOMER" ? "WEB" : value;
};

function BookingManagement() {
  const [noteContent, setNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [editingNote, setEditingNote] = useState(false);

  const [editingBookingRoom, setEditingBookingRoom] = useState(null);

  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  const [discountMessage, setDiscountMessage] = useState("");

  const [extraCosts, setExtraCosts] = useState([]);
  const [extraCostLoading, setExtraCostLoading] = useState(false);
  const [savingExtraCost, setSavingExtraCost] = useState(false);

  // ================= ADD ROOM STATE =================

  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [savingRoom, setSavingRoom] = useState(false);

  const [roomTypes, setRoomTypes] = useState([]);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);

  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingAvailableRooms, setLoadingAvailableRooms] = useState(false);

  const [roomForm, setRoomForm] = useState({
    roomTypeId: "",
    roomId: "",
    checkInDate: "",
    checkOutDate: "",
    guestCount: 1,
    discountCode: "",
  });

  // ================= EDIT BOOKING UI STATE =================

  const [setEditBookingItems] = useState({
    extraCosts: [],
    rooms: [],
    menuProducts: [],
    commonItems: [],
  });

  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editItemType, setEditItemType] = useState("");
  const [editingItem, setEditingItem] = useState(null);

  const [editItemForm, setEditItemForm] = useState({
    name: "",
    quantity: 1,
    price: "",
    date: "",
    note: "",
  });
  const { confirm, success: showSuccess, error: showError } = useAdminPopup();
  // ================= PAYMENT STATE =================

  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const [editingPayment, setEditingPayment] = useState(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "CASH_AT_HOTEL",
    paymentStatus: "PAID",
    paidAt: new Date()
      .toLocaleString("sv-SE", {
        timeZone: "Asia/Ho_Chi_Minh",
      })
      .slice(0, 16),
  });

  // ================= STATE =================

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [keyword, setKeyword] = useState("");

  const [filters, setFilters] = useState({
    status: "",
    checkInDate: "",
  });

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("management");

  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ================= MANUAL EDIT STATE =================

  const [showManualEdit, setShowManualEdit] = useState(false);
  const [savingManual, setSavingManual] = useState(false);

  const [manualForm, setManualForm] = useState({
    status: "PENDING",
  });

  // ================= ROLE =================

  const getUserRole = () => {
    return (
      sessionStorage.getItem("role") ||
      localStorage.getItem("role") ||
      ""
    ).toUpperCase();
  };

  const isAdmin = getUserRole() === "ADMIN";

  // ================= TOKEN =================

  const getToken = () => sessionStorage.getItem("admin_token");

  // ================= FETCH BOOKINGS =================

  const fetchBookings = useCallback(async (searchParams = {}) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      const searchKeyword = searchParams.keyword ?? "";
      const searchStatus = searchParams.status ?? "";
      const searchDate = searchParams.checkInDate ?? "";

      if (searchKeyword.trim()) {
        params.append("keyword", searchKeyword.trim());
      }

      if (searchStatus) {
        params.append("status", searchStatus);
      }

      if (searchDate) {
        params.append("checkInDate", searchDate);
      }

      const token = getToken();

      if (!token) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));

        throw new Error(result.message || "Không thể tải danh sách booking.");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Dữ liệu booking trả về không đúng định dạng.");
      }

      setBookings(data);
      setCurrentPage(1);
    } catch (err) {
      setBookings([]);
      setError(err.message || "Đã xảy ra lỗi khi tải booking.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ================= REAL-TIME SEARCH =================

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings({
        keyword,
        status: filters.status,
        checkInDate: filters.checkInDate,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, filters.status, filters.checkInDate, fetchBookings]);

  // ================= FILTER =================

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResetFilters = () => {
    setKeyword("");

    setFilters({
      status: "",
      checkInDate: "",
    });
  };

  const handleRefresh = () => {
    fetchBookings({
      keyword,
      status: filters.status,
      checkInDate: filters.checkInDate,
    });
  };

  // ================= STATISTICS =================

  const totalBookings = bookings.length;

  const pendingBookings = bookings.filter(
    (item) => item.status === "PENDING"
  ).length;

  const confirmedBookings = bookings.filter(
    (item) => item.status === "CONFIRMED"
  ).length;

  const checkedInBookings = bookings.filter(
    (item) => item.status === "CHECKED_IN"
  ).length;

  const completedBookings = bookings.filter(
    (item) => item.status === "COMPLETED"
  ).length;

  const canceledBookings = bookings.filter(
    (item) => item.status === "CANCELED"
  ).length;

  // ================= PAGINATION =================

  const totalPages = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));

  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const currentBookings = bookings.slice(startIndex, startIndex + PAGE_SIZE);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  // ================= EXTRA COST API =================

  const fetchExtraCosts = useCallback(
    async (bookingId) => {
      if (!bookingId) return;

      try {
        setExtraCostLoading(true);

        const token = getToken();

        if (!token) {
          throw new Error("Phiên đăng nhập đã hết hạn.");
        }

        const response = await fetch(`${API_URL}/${bookingId}/extra-costs`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(data.message || "Không thể tải chi phí phát sinh.");
        }

        setExtraCosts(Array.isArray(data) ? data : []);
      } catch (error) {
        setExtraCosts([]);
        showError(error.message || "Không thể tải chi phí phát sinh.");
      } finally {
        setExtraCostLoading(false);
      }
    },
    [showError]
  );
  useEffect(() => {
    if (selectedBooking?.id && activeDetailTab === "edit") {
      fetchExtraCosts(selectedBooking.id);
    }
  }, [selectedBooking?.id, activeDetailTab, fetchExtraCosts]);

  // ================= VIEW NOTE =================

  const handleSaveBookingNote = async () => {
    if (!noteContent.trim() || !selectedBooking?.id) return;

    try {
      setSavingNote(true);
      const oldNote = (selectedBooking.note || "")
        .replace(/\\n/g, "\n")
        .trimEnd();

      const newNote = noteContent.replace(/\\n/g, "\n").trim();

      const updatedNote = editingNote
        ? newNote
        : oldNote
        ? `${oldNote}\n${newNote}`
        : newNote;
      const response = await fetch(
        `${API_URL}/${selectedBooking.id}/note`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(updatedNote),
        }
      );

      if (!response.ok) {
        throw new Error("Không thể lưu ghi chú.");
      }

      const data = await response.json();

      setSelectedBooking((prev) => ({
        ...prev,
        ...data,
        note: data.note || "",
      }));

      // Reset ô nhập sau khi lưu
      setNoteContent("");
      setEditingNote(false);

      window.showPopup?.(
        editingNote
          ? "Cập nhật ghi chú thành công!"
          : "Thêm ghi chú thành công!",
        "success"
      );
    } catch (error) {
      console.error("Lỗi lưu ghi chú:", error);
      window.showPopup?.(error.message, "error");
    } finally {
      setSavingNote(false);
    }
  };
  const handleEditBookingNote = () => {
    const currentNote = selectedBooking?.note || "";

    setNoteContent(currentNote.replace(/\\n/g, "\n"));
    setEditingNote(true);
  };
  const handleDeleteBookingNote = async () => {
    if (!selectedBooking?.id) return;

    // Hiển thị hộp thoại xác nhận
    const accepted = await confirm({
      title: "Xác nhận xóa ghi chú",
      message:
        "Bạn có chắc chắn muốn xóa toàn bộ ghi chú của đơn đặt phòng này không?",
      confirmText: "Xóa ghi chú",
      cancelText: "Hủy",
      danger: true,
    });

    if (!accepted) return;

    try {
      setSavingNote(true);

      const response = await fetch(
        `${API_URL}/${selectedBooking.id}/note`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(null),
        }
      );

      if (!response.ok) {
        throw new Error("Không thể xóa ghi chú.");
      }

      const data = await response.json();

      setSelectedBooking((prev) => ({
        ...prev,
        ...data,
        note: "",
      }));

      setNoteContent("");
      setEditingNote(false);

      window.showPopup?.("Đã xóa ghi chú thành công!", "success");
    } catch (error) {
      console.error("Lỗi xóa ghi chú:", error);
      window.showPopup?.(error.message, "error");
    } finally {
      setSavingNote(false);
    }
  };
  // ================= VIEW DETAIL =================

  const handleViewDetail = async (bookingId) => {
    try {
      setActiveDetailTab("management");
      setDetailLoading(true);
      setSelectedBooking(null);
      setError("");

      await fetchBookingDetail(bookingId);
    } catch (err) {
      setError(err.message || "Không thể tải chi tiết booking.");
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchBookingDetail = async (bookingId) => {
    if (!bookingId) return;

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Phiên đăng nhập đã hết hạn.");
      }

      const response = await fetch(`${API_URL}/${bookingId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Không thể tải chi tiết booking.");
      }

      setSelectedBooking(data);

      return data;
    } catch (error) {
      showError(error.message || "Không thể tải chi tiết booking.");
      throw error;
    }
  };
  // ================= PAYMENT HISTORY =================

  const openEditPayment = (payment) => {
    setEditingPayment(payment);

    setPaymentForm({
      amount: payment.amount ?? "",
      paymentMethod: payment.paymentMethod ?? "CASH_AT_HOTEL",
      paymentStatus: payment.paymentStatus ?? "PAID",
      paidAt: payment.paidAt ? payment.paidAt.slice(0, 16) : "",
    });

    setShowAddPayment(true);
  };
  const fetchPaymentHistory = useCallback(
    async (bookingId) => {
      if (!bookingId) return;

      try {
        setPaymentLoading(true);

        const token = getToken();

        if (!token) {
          throw new Error(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          );
        }

        const response = await fetch(`${API_URL}/${bookingId}/payments`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));

          throw new Error(
            result.message || "Không thể tải lịch sử thanh toán."
          );
        }

        const data = await response.json();

        setPaymentHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        setPaymentHistory([]);

        showError(err.message || "Không thể tải lịch sử thanh toán.");
      } finally {
        setPaymentLoading(false);
      }
    },
    [showError]
  );
  // ================= ADD PAYMENT =================

  const openAddPayment = () => {
    setPaymentForm({
      amount: "",
      paymentMethod: "CASH_AT_HOTEL",
      paymentStatus: "PAID",
      paidAt: new Date()
        .toLocaleString("sv-SE", {
          timeZone: "Asia/Ho_Chi_Minh",
        })
        .slice(0, 16),
    });

    setShowAddPayment(true);
  };

  const closeAddPayment = () => {
    if (savingPayment) return;

    setShowAddPayment(false);
  };

  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "amount") {
      const rawValue = value.replace(/\D/g, "");

      setPaymentForm((prev) => ({
        ...prev,
        amount: rawValue,
      }));

      return;
    }

    setPaymentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ================= SAVE PAYMENT =================

  const handleSavePayment = async () => {
    try {
      setSavingPayment(true);

      const amount = Number(paymentForm.amount);

      if (!amount || amount <= 0) {
        showError("Vui lòng nhập số tiền hợp lệ.");
        return;
      }

      const requestData = {
        amount,
        paymentMethod: paymentForm.paymentMethod,
        paymentStatus: paymentForm.paymentStatus,
        paidAt:
          paymentForm.paymentStatus === "PAID"
            ? paymentForm.paidAt || null
            : null,
      };

      const token = sessionStorage.getItem("admin_token");

      // Xác định thêm mới hay cập nhật
      const isEditing = Boolean(editingPayment);

      const url = isEditing
        ? `${API_URL}/${selectedBooking.id}/payments/${editingPayment.id}`
        : `${API_URL}/${selectedBooking.id}/payments`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      // Đọc kết quả trả về
      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.message ||
            responseData?.error ||
            "Không thể lưu thông tin thanh toán."
        );
      }

      showSuccess(
        isEditing
          ? "Cập nhật thanh toán thành công!"
          : "Thêm thanh toán thành công!"
      );

      setShowAddPayment(false);
      setEditingPayment(null);

      await fetchPaymentHistory(selectedBooking.id);
    } catch (error) {
      console.error("Lỗi lưu thanh toán:", error);
      showError(error.message || "Không thể lưu thông tin thanh toán.");
    } finally {
      setSavingPayment(false);
    }
  };

  // ================= AUTO LOAD PAYMENT HISTORY =================

  useEffect(() => {
    if (selectedBooking?.id && activeDetailTab === "payment") {
      fetchPaymentHistory(selectedBooking.id);
    }
  }, [selectedBooking?.id, activeDetailTab, fetchPaymentHistory]);

  // Tự động tải lịch sử khi mở tab Thanh toán
  useEffect(() => {
    if (selectedBooking?.id && activeDetailTab === "payment") {
      fetchPaymentHistory(selectedBooking.id);
    }
  }, [selectedBooking?.id, activeDetailTab, fetchPaymentHistory]);

  const closeDetail = () => {
    if (showManualEdit || savingManual || showAddPayment || savingPayment) {
      return;
    }

    setSelectedBooking(null);
    setPaymentHistory([]);
  };

  // ================= NORMAL STATUS UPDATE =================

  // Nhân viên vẫn chỉ được chuyển trạng thái theo quy trình.
  // Admin có thể chọn bất kỳ trạng thái nào.
  const getAllowedStatuses = (booking) => {
    if (!booking || !booking.status) return [];

    switch (booking.status) {
      case "PENDING":
        return ["CONFIRMED", "CANCELED"];

      case "CONFIRMED":
        return ["CHECKED_IN", "CANCELED"];

      case "CHECKED_IN":
        return ["COMPLETED"];

      case "COMPLETED":
      case "CANCELED":
      default:
        return [];
    }
  };

  // ================= EXECUTE STATUS UPDATE =================

  const executeStatusUpdate = async (booking, newStatus) => {
    try {
      setUpdatingStatus(true);

      const token = getToken();

      if (!token) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      const response = await fetch(
        `${API_URL}/${booking.id}/status?status=${encodeURIComponent(
          newStatus
        )}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));

        throw new Error(
          result.message || "Không thể cập nhật trạng thái booking."
        );
      }

      await fetchBookings({
        keyword,
        status: filters.status,
        checkInDate: filters.checkInDate,
      });

      if (selectedBooking?.id === booking.id) {
        await handleViewDetail(booking.id);
      }

      showSuccess(
        `Booking đã được cập nhật sang trạng thái "${STATUS_LABELS[newStatus]}".`
      );
    } catch (err) {
      showError(err.message || "Đã xảy ra lỗi khi cập nhật trạng thái.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ================= CONFIRM STATUS UPDATE =================

  const confirmStatusUpdate = async (booking, newStatus) => {
    const isConfirmed = await confirm({
      title: "Xác nhận cập nhật trạng thái",
      message: `Bạn có chắc chắn muốn chuyển booking này sang trạng thái "${STATUS_LABELS[newStatus]}" không?`,
      confirmText: "Xác nhận",
      cancelText: "Quay lại",
      danger: newStatus === "CANCELED",
    });

    if (!isConfirmed) return;

    await executeStatusUpdate(booking, newStatus);
  };

  // ================= ADD ROOM HANDLERS =================

  // Lấy danh sách hạng phòng
  const fetchRoomTypes = async () => {
    try {
      setLoadingRoomTypes(true);

      const token = getToken();

      if (!token) {
        throw new Error("Phiên đăng nhập đã hết hạn.");
      }

      const response = await fetch(
        `${API_URL_ROOMS}/room-types`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(data?.message || "Không thể tải danh sách hạng phòng.");
      }

      setRoomTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      setRoomTypes([]);
      showError(error.message || "Không thể tải danh sách hạng phòng.");
    } finally {
      setLoadingRoomTypes(false);
    }
  };

  // Lấy danh sách phòng trống theo điều kiện
  const fetchAvailableRooms = useCallback(async () => {
    if (
      !selectedBooking?.id ||
      !roomForm.roomTypeId ||
      !roomForm.checkInDate ||
      !roomForm.checkOutDate ||
      !roomForm.guestCount
    ) {
      setAvailableRooms([]);
      return;
    }

    if (roomForm.checkOutDate <= roomForm.checkInDate) {
      setAvailableRooms([]);
      return;
    }

    try {
      setLoadingAvailableRooms(true);

      const token = getToken();

      if (!token) {
        throw new Error("Phiên đăng nhập đã hết hạn.");
      }

      const params = new URLSearchParams({
        roomTypeId: roomForm.roomTypeId,
        checkInDate: roomForm.checkInDate,
        checkOutDate: roomForm.checkOutDate,
        guestCount: String(roomForm.guestCount),
      });
      
      const response = await fetch(
        `${API_URL_ROOMS}/${
          selectedBooking.id
        }/available-rooms?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(
          data?.message || "Không thể tải danh sách phòng trống."
        );
      }

      const rooms = Array.isArray(data) ? data : [];

      // Giữ phòng hiện tại khi chỉnh sửa booking
      const currentRoomId =
        editingBookingRoom?.roomId ?? editingBookingRoom?.id;

      if (
        editingBookingRoom &&
        currentRoomId != null &&
        !rooms.some((item) => Number(item.id) === Number(currentRoomId))
      ) {
        rooms.push({
          id: currentRoomId,
          roomNumber: editingBookingRoom.roomNumber,
          floor: editingBookingRoom.floor,
          basePrice:
            editingBookingRoom.basePrice ?? editingBookingRoom.roomPrice,
        });
      }

      setAvailableRooms(rooms);
    } catch (error) {
      setAvailableRooms([]);
      showError(error.message || "Không thể tải phòng trống.");
    } finally {
      setLoadingAvailableRooms(false);
    }
  }, [
    selectedBooking?.id,
    roomForm.roomTypeId,
    roomForm.checkInDate,
    roomForm.checkOutDate,
    roomForm.guestCount,
    editingBookingRoom,
    showError,
  ]);

  // Mở modal thêm phòng
  const openAddRoomModal = async () => {
    setEditingBookingRoom(null);
    setRoomForm({
      roomTypeId: "",
      roomId: "",
      checkInDate: selectedBooking?.checkInDate || "",
      checkOutDate: selectedBooking?.checkOutDate || "",
      guestCount: 1,
      discountCode: "",
    });
    resetDiscountState();
    setAvailableRooms([]);
    setRoomTypes([]);
    setShowAddRoomModal(true);
    await fetchRoomTypes();
  };

  // Mở cùng modal để chỉnh sửa một phòng đã có trong booking.
  // Cho phép đổi cả phòng vật lý, ngày ở, số khách và mã giảm giá.
  const openEditRoomModal = async (bookingRoom) => {
    // roomId là ID của phòng vật lý; id/bookingRoomId là ID dòng BookingRoom.
    const roomId =
      bookingRoom.roomId ?? bookingRoom.room?.id ?? bookingRoom.physicalRoomId;
    const roomType = roomTypes.find(
      (item) => Number(item.roomTypeId) === Number(bookingRoom.roomTypeId)
    );
    setEditingBookingRoom(bookingRoom);
    setRoomForm({
      roomTypeId: String(bookingRoom.roomTypeId ?? roomType?.roomTypeId ?? ""),
      roomId: String(roomId ?? ""),
      checkInDate:
        bookingRoom.checkInDate || selectedBooking?.checkInDate || "",
      checkOutDate:
        bookingRoom.checkOutDate || selectedBooking?.checkOutDate || "",
      guestCount: Number(bookingRoom.guestCount || 1),
      discountCode: bookingRoom.discountCode || "",
    });
    resetDiscountState();
    setAvailableRooms([]);
    setShowAddRoomModal(true);
    await fetchRoomTypes();
  };

  // Đóng modal
  const closeAddRoomModal = () => {
    if (savingRoom) return;
    resetDiscountState();
    setEditingBookingRoom(null);
    setShowAddRoomModal(false);
    setAvailableRooms([]);
  };

  // Lấy hạng phòng đang chọn
  const selectedRoomType = roomTypes.find(
    (type) => Number(type.roomTypeId) === Number(roomForm.roomTypeId)
  );

  // Xử lý thay đổi form
  const handleRoomFormChange = (e) => {
    const { name, value } = e.target;

    setRoomForm((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      // Khi đổi hạng phòng, xóa phòng đã chọn
      if (name === "roomTypeId") {
        next.roomId = "";
        next.guestCount = 1;
      }

      // Khi đổi số khách, xóa phòng đã chọn
      if (name === "guestCount") {
        next.roomId = "";
      }

      // Khi đổi ngày, xóa phòng đã chọn
      if (name === "checkInDate" || name === "checkOutDate") {
        next.roomId = "";
      }

      return next;
    });
  };
  const handleDiscountCodeChange = (value) => {
    setRoomForm((prev) => ({
      ...prev,
      discountCode: value.toUpperCase(),
    }));

    setAppliedDiscount(null);
    setDiscountMessage("");
  };
  const handleApplyDiscount = async () => {
    const code = roomForm.discountCode?.trim();

    if (!code) {
      setDiscountMessage("Vui lòng nhập mã giảm giá.");
      setAppliedDiscount(null);
      return;
    }

    try {
      setApplyingDiscount(true);
      setDiscountMessage("");
      setAppliedDiscount(null);

      const token = getToken();

      const response = await fetch(
        "http://localhost:8080/api/discount-codes/validate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            roomId: roomForm.roomId,
            checkInDate: roomForm.checkInDate,
            checkOutDate: roomForm.checkOutDate,
            discountCode: code,
          }),
        }
      );

      // Đọc response dưới dạng text trước để tránh lỗi JSON rỗng
      const responseText = await response.text();

      let data = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = { message: responseText };
        }
      }

      if (!response.ok) {
        setAppliedDiscount(null);

        setDiscountMessage(
          data.message ||
            data.error ||
            "Mã giảm giá không hợp lệ hoặc không thể áp dụng."
        );

        return;
      }

      setAppliedDiscount(data);
      setDiscountMessage(data.message || "Áp dụng mã giảm giá thành công!");
    } catch (error) {
      console.error("Lỗi áp dụng mã giảm giá:", error);

      setAppliedDiscount(null);
      setDiscountMessage("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setApplyingDiscount(false);
    }
  };
  // Tự động tải phòng trống khi điều kiện tìm kiếm thay đổi
  useEffect(() => {
    if (!showAddRoomModal) return;

    const timer = setTimeout(() => {
      fetchAvailableRooms();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    showAddRoomModal,
    selectedBooking?.id,
    roomForm.roomTypeId,
    roomForm.checkInDate,
    roomForm.checkOutDate,
    roomForm.guestCount,
    editingBookingRoom,
    fetchAvailableRooms,
  ]);

  const resetDiscountState = () => {
    setAppliedDiscount(null);
    setDiscountMessage("");
    setApplyingDiscount(false);
  };

  // Thêm mới hoặc cập nhật phòng trong Booking (dùng chung form).
  const handleAddRoomToBooking = async () => {
    if (!selectedBooking) return;

    const roomId = Number(roomForm.roomId);
    const guestCount = Number(roomForm.guestCount);
    const capacity = Number(selectedRoomType?.capacity || 0);

    if (!roomForm.checkInDate || !roomForm.checkOutDate) {
      showError("Vui lòng chọn ngày nhận phòng và ngày trả phòng.");
      return;
    }
    if (roomForm.checkOutDate <= roomForm.checkInDate) {
      showError("Ngày trả phòng phải sau ngày nhận phòng.");
      return;
    }
    if (!roomForm.roomTypeId) {
      showError("Vui lòng chọn hạng phòng.");
      return;
    }
    if (!guestCount || guestCount < 1) {
      showError("Số lượng khách phải lớn hơn 0.");
      return;
    }
    if (guestCount > capacity) {
      showError(`Hạng phòng này chỉ cho phép tối đa ${capacity} khách.`);
      return;
    }
    if (!roomId) {
      showError("Vui lòng chọn phòng.");
      return;
    }

    try {
      setSavingRoom(true);
      const token = getToken();
      if (!token) throw new Error("Phiên đăng nhập đã hết hạn.");

      const requestData = {
        roomId,
        checkInDate: roomForm.checkInDate,
        checkOutDate: roomForm.checkOutDate,
        guestCount,
        discountCode: appliedDiscount
          ? roomForm.discountCode.trim()
          : roomForm.discountCode.trim() || null,
      };

      const isEditing = Boolean(editingBookingRoom);
      const bookingRoomId =
        editingBookingRoom?.bookingRoomId ?? editingBookingRoom?.id;
      if (isEditing && bookingRoomId == null) {
        throw new Error(
          "Không xác định được mã phòng thuộc booking để cập nhật."
        );
      }

      const url = isEditing
        ? `${API_URL_ROOMS}/${selectedBooking.id}/rooms/${bookingRoomId}`
        : `${API_URL_ROOMS}/${selectedBooking.id}/rooms`;
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (isEditing
              ? "Không thể cập nhật phòng."
              : "Không thể thêm phòng vào booking.")
        );
      }

      // API có thể trả booking đầy đủ hoặc chỉ trả thông báo; nếu chỉ trả thông báo,
      // tải lại chi tiết booking để cập nhật danh sách và tổng tiền chính xác.
      if (data && Array.isArray(data.rooms)) {
        setSelectedBooking(data);
      } else {
        const detailResponse = await fetch(`${API_URL}/${selectedBooking.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const detailData = await detailResponse.json().catch(() => null);
        if (detailResponse.ok && detailData) setSelectedBooking(detailData);
        else if (data) setSelectedBooking(data);
      }

      setShowAddRoomModal(false);
      setEditingBookingRoom(null);
      setAvailableRooms([]);
      await fetchBookings({
        keyword,
        status: filters.status,
        checkInDate: filters.checkInDate,
      });
      showSuccess(
        isEditing
          ? "Cập nhật phòng thành công!"
          : "Thêm phòng vào booking thành công!"
      );
    } catch (error) {
      console.error("Lỗi lưu phòng:", error);
      showError(error.message || "Không thể lưu thông tin phòng.");
    } finally {
      setSavingRoom(false);
    }
  };

  // Xóa một phòng riêng lẻ khỏi booking.
  const handleDeleteBookingRoom = async (bookingRoom) => {
    if (!selectedBooking) return;
    const bookingRoomId = bookingRoom.bookingRoomId;
    if (bookingRoomId == null) {
      showError("Không xác định được mã phòng thuộc booking.");
      return;
    }
    const accepted = await confirm({
      title: "Xác nhận xóa phòng",
      message: `Bạn có chắc chắn muốn xóa phòng ${
        bookingRoom.roomNumber || "này"
      } khỏi booking không?`,
      confirmText: "Xóa phòng",
      cancelText: "Hủy",
      danger: true,
    });
    if (!accepted) return;

    try {
      const token = getToken();
      if (!token) throw new Error("Phiên đăng nhập đã hết hạn.");
      const response = await fetch(
        `${API_URL_ROOMS}/${selectedBooking.id}/rooms/${bookingRoomId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(data?.message || data?.error || "Không thể xóa phòng.");

      const detailResponse = await fetch(`${API_URL}/${selectedBooking.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const detailData = await detailResponse.json().catch(() => null);
      if (detailResponse.ok && detailData) setSelectedBooking(detailData);
      await fetchBookings({
        keyword,
        status: filters.status,
        checkInDate: filters.checkInDate,
      });
      showSuccess("Đã xóa phòng khỏi booking!");
    } catch (error) {
      showError(error.message || "Không thể xóa phòng.");
    }
  };

  // ================= MANUAL EDIT =================

  const openManualEdit = () => {
    if (!selectedBooking) return;

    setManualForm({
      status: selectedBooking.status || "PENDING",
    });

    setShowManualEdit(true);
  };

  const closeManualEdit = () => {
    if (savingManual) return;

    setShowManualEdit(false);
  };

  const handleManualFormChange = (e) => {
    const { name, value } = e.target;

    setManualForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ================= SAVE MANUAL EDIT =================

  const handleSaveManualEdit = async () => {
    if (!isAdmin) {
      showError("Bạn không có quyền chỉnh sửa trạng thái thủ công.");
      return;
    }

    if (!selectedBooking) return;

    if (manualForm.status === selectedBooking.status) {
      showError("Trạng thái mới phải khác trạng thái hiện tại.");
      return;
    }

    const isConfirmed = await confirm({
      title: "Xác nhận sửa trạng thái thủ công",
      message: `Bạn có chắc chắn muốn chuyển booking sang trạng thái "${
        STATUS_LABELS[manualForm.status]
      }" không?`,
      confirmText: "Lưu thay đổi",
      cancelText: "Hủy",
      danger: manualForm.status === "CANCELED",
    });

    if (!isConfirmed) return;

    try {
      setSavingManual(true);

      const token = getToken();

      if (!token) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }

      // Sử dụng API cập nhật trạng thái hiện tại.
      // Không gọi /manual-status nữa.
      const response = await fetch(
        `${API_URL}/${selectedBooking.id}/status?status=${encodeURIComponent(
          manualForm.status
        )}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));

        throw new Error(
          result.message || "Không thể cập nhật trạng thái booking."
        );
      }

      setShowManualEdit(false);

      await fetchBookings({
        keyword,
        status: filters.status,
        checkInDate: filters.checkInDate,
      });

      await handleViewDetail(selectedBooking.id);

      showSuccess("Cập nhật trạng thái booking thành công.");
    } catch (err) {
      showError(err.message || "Đã xảy ra lỗi khi cập nhật trạng thái.");
    } finally {
      setSavingManual(false);
    }
  };
  // ================= EDIT BOOKING UI HANDLERS =================

  const EDIT_ITEM_CONFIG = {
    extraCosts: {
      title: "Chi phí phát sinh",
      icon: "bi-exclamation-circle",
      color: "orange",
    },
    rooms: {
      title: "Phòng",
      icon: "bi-tent",
      color: "blue",
    },
    menuProducts: {
      title: "Sản phẩm menu",
      icon: "bi-cup-hot",
      color: "orange",
    },
    commonItems: {
      title: "Item chung",
      icon: "bi-box",
      color: "purple",
    },
  };

  const openEditItemModal = (type, item = null) => {
    setEditItemType(type);
    setEditingItem(item);

    setEditItemForm(
      item
        ? {
            name: item.name || "",
            quantity: item.quantity || 1,
            price: item.unitPrice ?? item.price ?? "",
            date: item.incurredDate || item.date || "",
            note: item.note || "",
          }
        : {
            name: "",
            quantity: 1,
            price: "",
            date: selectedBooking?.checkInDate || "",
            note: "",
          }
    );

    setShowEditItemModal(true);
  };

  const closeEditItemModal = () => {
    setShowEditItemModal(false);
    setEditingItem(null);
  };

  const handleEditItemFormChange = (e) => {
    const { name, value } = e.target;

    setEditItemForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEditItem = async () => {
    if (!editItemForm.name.trim()) {
      showError("Vui lòng nhập tên hạng mục.");
      return;
    }

    const quantity = Number(editItemForm.quantity);
    const price = Number(String(editItemForm.price).replace(/\D/g, ""));

    if (!Number.isFinite(quantity) || quantity <= 0) {
      showError("Số lượng phải lớn hơn 0.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      showError("Vui lòng nhập đơn giá hợp lệ.");
      return;
    }

    // ================= CHI PHÍ PHÁT SINH =================

    if (editItemType === "extraCosts") {
      try {
        setSavingExtraCost(true);

        const token = getToken();

        if (!token) {
          throw new Error("Phiên đăng nhập đã hết hạn.");
        }

        const requestData = {
          name: editItemForm.name.trim(),
          description: null,
          quantity: quantity,
          unitPrice: price,
          incurredDate: editItemForm.date || null,
          note: editItemForm.note || "",
        };

        const isEditing = Boolean(editingItem);

        const url = isEditing
          ? `${API_URL}/${selectedBooking.id}/extra-costs/${editingItem.id}`
          : `${API_URL}/${selectedBooking.id}/extra-costs`;

        const response = await fetch(url, {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestData),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message || data?.error || "Không thể lưu chi phí phát sinh."
          );
        }

        await fetchExtraCosts(selectedBooking.id);
        await fetchBookingDetail(selectedBooking.id);
        await fetchBookings();
        showSuccess(
          isEditing
            ? "Cập nhật chi phí phát sinh thành công!"
            : "Thêm chi phí phát sinh thành công!"
        );

        closeEditItemModal();
      } catch (error) {
        console.error("Lỗi lưu chi phí phát sinh:", error);
        showError(error.message || "Không thể lưu chi phí phát sinh.");
      } finally {
        setSavingExtraCost(false);
      }

      return;
    }

    // ================= CÁC HẠNG MỤC KHÁC =================

    const newItem = {
      id: editingItem?.id || Date.now(),
      name: editItemForm.name.trim(),
      quantity,
      price,
      date: editItemForm.date,
      note: editItemForm.note,
    };

    setEditBookingItems((prev) => {
      const currentItems = prev[editItemType] || [];

      return {
        ...prev,
        [editItemType]: editingItem
          ? currentItems.map((item) =>
              item.id === editingItem.id ? newItem : item
            )
          : [...currentItems, newItem],
      };
    });

    showSuccess(
      editingItem
        ? "Cập nhật hạng mục thành công!"
        : "Thêm hạng mục thành công!"
    );

    closeEditItemModal();
  };

  const handleDeleteEditItem = async (type, item) => {
    const confirmed = await confirm({
      title: "Xác nhận xóa",
      message: `Bạn có chắc chắn muốn xóa "${item.name}" không?`,
      confirmText: "Xóa",
      cancelText: "Hủy",
      danger: true,
    });

    if (!confirmed) return;

    // ================= XÓA CHI PHÍ PHÁT SINH =================

    if (type === "extraCosts") {
      try {
        const token = getToken();

        if (!token) {
          throw new Error("Phiên đăng nhập đã hết hạn.");
        }

        const response = await fetch(
          `${API_URL}/${selectedBooking.id}/extra-costs/${item.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));

          throw new Error(
            data.message || data.error || "Không thể xóa chi phí phát sinh."
          );
        }

        await fetchExtraCosts(selectedBooking.id);
        await fetchBookingDetail(selectedBooking.id);
        await fetchBookings();
        showSuccess("Xóa chi phí phát sinh thành công!");
      } catch (error) {
        console.error("Lỗi xóa chi phí:", error);
        showError(error.message || "Không thể xóa chi phí.");
      }

      return;
    }

    // ================= XÓA CÁC HẠNG MỤC KHÁC =================

    setEditBookingItems((prev) => ({
      ...prev,
      [type]: prev[type].filter((value) => value.id !== item.id),
    }));

    showSuccess("Đã xóa hạng mục.");
  };

  const formatEditMoneyInput = (value) => {
    if (value === "" || value == null) return "";

    return new Intl.NumberFormat("vi-VN").format(Number(value));
  };

  // ================= DETAIL TAB HELPERS =================

  const DETAIL_TABS = [
    { id: "management", label: "Quản lý", icon: "bi-gear" },
    { id: "customer", label: "Khách hàng", icon: "bi-person" },
    { id: "stay", label: "Lưu trú", icon: "bi-calendar-check" },
    { id: "payment", label: "Thanh toán", icon: "bi-credit-card" },
    { id: "edit", label: "Chỉnh sửa", icon: "bi-pencil-square" },
    { id: "notes", label: "Ghi chú", icon: "bi-chat-left-text" },
    { id: "bill", label: "Bill", icon: "bi-receipt" },
  ];


  const renderAddRoomModal = () => {
    if (!showAddRoomModal || !selectedBooking) return null;

    return (
      <div className="booking-edit-modal-backdrop" onClick={closeAddRoomModal}>
        <div
          className="booking-edit-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="booking-edit-modal-header">
            <h3>
              <i className="bi bi-door-open"></i>
              {editingBookingRoom
                ? "Chỉnh sửa phòng"
                : "Thêm phòng vào booking"}
            </h3>

            <button
              type="button"
              onClick={closeAddRoomModal}
              disabled={savingRoom}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="booking-edit-modal-body">
            {/* NGÀY NHẬN - TRẢ PHÒNG */}
            <div className="booking-edit-form-grid">
              <div className="booking-edit-field">
                <label>
                  Ngày nhận phòng <span>*</span>
                </label>

                <input
                  type="date"
                  name="checkInDate"
                  value={roomForm.checkInDate}
                  onChange={handleRoomFormChange}
                  disabled={savingRoom}
                />
              </div>

              <div className="booking-edit-field">
                <label>
                  Ngày trả phòng <span>*</span>
                </label>

                <input
                  type="date"
                  name="checkOutDate"
                  min={roomForm.checkInDate || undefined}
                  value={roomForm.checkOutDate}
                  onChange={handleRoomFormChange}
                  disabled={savingRoom}
                />
              </div>
            </div>

            {/* CHỌN HẠNG PHÒNG */}
            <div className="booking-edit-field">
              <label>
                Hạng phòng <span>*</span>
              </label>

              <select
                name="roomTypeId"
                value={roomForm.roomTypeId}
                onChange={handleRoomFormChange}
                disabled={savingRoom || loadingRoomTypes}
              >
                <option value="">
                  {loadingRoomTypes
                    ? "Đang tải hạng phòng..."
                    : "-- Chọn hạng phòng --"}
                </option>

                {roomTypes.map((type) => (
                  <option key={type.roomTypeId} value={type.roomTypeId}>
                    {type.roomTypeName} - Sức chứa {type.capacity} khách
                  </option>
                ))}
              </select>
            </div>

            {/* THÔNG TIN HẠNG PHÒNG */}
            {selectedRoomType && (
              <div className="booking-edit-modal-total">
                <div>
                  <span>Hạng phòng</span>
                  <strong>{selectedRoomType.roomTypeName}</strong>
                </div>

                <div>
                  <span>Sức chứa tối đa</span>
                  <strong>{selectedRoomType.capacity} khách</strong>
                </div>

                <div>
                  <span>Giá niêm yết</span>
                  <strong>{formatMoney(selectedRoomType.basePrice)}</strong>
                </div>
              </div>
            )}

            {/* SỐ LƯỢNG KHÁCH */}
            <div className="booking-edit-field">
              <label>
                Số lượng khách <span>*</span>
              </label>

              <select
                name="guestCount"
                value={roomForm.guestCount}
                onChange={handleRoomFormChange}
                disabled={savingRoom || !selectedRoomType}
              >
                {selectedRoomType &&
                  Array.from(
                    { length: Number(selectedRoomType.capacity) || 0 },
                    (_, index) => index + 1
                  ).map((number) => (
                    <option key={number} value={number}>
                      {number} khách
                    </option>
                  ))}
              </select>

              {selectedRoomType && (
                <small>
                  Số khách tối đa của hạng phòng này là{" "}
                  {selectedRoomType.capacity} khách.
                </small>
              )}
            </div>

            {/* CHỌN PHÒNG TRỐNG */}
            <div className="booking-edit-field">
              <label>
                Phòng trống <span>*</span>
              </label>

              <select
                name="roomId"
                value={roomForm.roomId}
                onChange={handleRoomFormChange}
                disabled={
                  savingRoom ||
                  loadingAvailableRooms ||
                  !roomForm.roomTypeId ||
                  !roomForm.checkInDate ||
                  !roomForm.checkOutDate ||
                  roomForm.checkOutDate <= roomForm.checkInDate
                }
              >
                <option value="">
                  {loadingAvailableRooms
                    ? "Đang tìm phòng trống..."
                    : !roomForm.roomTypeId
                    ? "-- Vui lòng chọn hạng phòng trước --"
                    : availableRooms.length === 0
                    ? "-- Không có phòng trống phù hợp --"
                    : "-- Chọn phòng --"}
                </option>

                {availableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Phòng {room.roomNumber}
                    {room.floor != null ? ` - Tầng ${room.floor}` : ""}
                    {" - "}
                    {formatMoney(room.basePrice)}
                  </option>
                ))}
              </select>

              {loadingAvailableRooms && (
                <small>Đang kiểm tra tình trạng phòng...</small>
              )}

              {!loadingAvailableRooms &&
                roomForm.roomTypeId &&
                roomForm.checkInDate &&
                roomForm.checkOutDate &&
                roomForm.checkOutDate > roomForm.checkInDate &&
                availableRooms.length === 0 && (
                  <small>
                    Không tìm thấy phòng trống phù hợp với ngày và số khách đã
                    chọn.
                  </small>
                )}
            </div>

            {/* MÃ GIẢM GIÁ */}
            <div className="booking-edit-field">
              <label>Mã giảm giá</label>

              <div className="discount-input-group">
                <input
                  type="text"
                  value={roomForm.discountCode || ""}
                  onChange={(e) => handleDiscountCodeChange(e.target.value)}
                  placeholder="Nhập mã giảm giá"
                  disabled={applyingDiscount || savingRoom}
                />

                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  disabled={
                    applyingDiscount ||
                    savingRoom ||
                    !roomForm.discountCode?.trim() ||
                    !roomForm.roomId ||
                    !roomForm.checkInDate ||
                    !roomForm.checkOutDate ||
                    roomForm.checkOutDate <= roomForm.checkInDate
                  }
                >
                  {applyingDiscount ? "Đang kiểm tra..." : "Áp dụng"}
                </button>
              </div>

              {discountMessage && (
                <p
                  className={
                    appliedDiscount ? "discount-success" : "discount-error"
                  }
                >
                  <i
                    className={`bi ${
                      appliedDiscount
                        ? "bi-check-circle-fill"
                        : "bi-exclamation-circle-fill"
                    }`}
                  ></i>{" "}
                  {discountMessage}
                </p>
              )}
            </div>

            {/* THÔNG TIN GIẢM GIÁ */}
            {appliedDiscount && (
              <div className="discount-summary">
                <p>
                  <span>Tạm tính:</span>
                  <strong>
                    {Number(appliedDiscount.totalAmount || 0).toLocaleString(
                      "vi-VN"
                    )}
                    đ
                  </strong>
                </p>

                <p>
                  <span>Giảm giá:</span>
                  <strong className="discount-amount">
                    -
                    {Number(appliedDiscount.discountAmount || 0).toLocaleString(
                      "vi-VN"
                    )}
                    đ
                  </strong>
                </p>

                <p className="discount-final">
                  <span>Thành tiền:</span>
                  <strong>
                    {Number(appliedDiscount.finalAmount || 0).toLocaleString(
                      "vi-VN"
                    )}
                    đ
                  </strong>
                </p>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="booking-edit-modal-footer">
            <button
              type="button"
              className="cancel"
              onClick={closeAddRoomModal}
              disabled={savingRoom}
            >
              Hủy
            </button>

            <button
              type="button"
              className="save"
              onClick={handleAddRoomToBooking}
              disabled={
                savingRoom ||
                applyingDiscount ||
                loadingAvailableRooms ||
                !roomForm.roomId ||
                !roomForm.roomTypeId
              }
            >
              {savingRoom
                ? editingBookingRoom
                  ? "Đang cập nhật..."
                  : "Đang thêm..."
                : editingBookingRoom
                ? "Lưu thay đổi"
                : "Xác nhận thêm phòng"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ================= EDIT BOOKING ITEM MODAL =================

  const renderEditItemModal = () => {
    if (!showEditItemModal) return null;

    const config = EDIT_ITEM_CONFIG[editItemType];

    if (!config) return null;

    return (
      <div className="booking-edit-modal-backdrop" onClick={closeEditItemModal}>
        <div
          className="booking-edit-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="booking-edit-modal-header">
            <h3>
              <i className={`bi ${config.icon}`}></i>
              {editingItem ? "Thay đổi " : "Thêm "}
              {config.title}
            </h3>

            <button type="button" onClick={closeEditItemModal}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="booking-edit-modal-body">
            <div className="booking-edit-field">
              <label>
                Tên hạng mục <span>*</span>
              </label>

              <input
                type="text"
                name="name"
                value={editItemForm.name}
                onChange={handleEditItemFormChange}
                placeholder="Nhập tên hạng mục..."
              />
            </div>

            <div className="booking-edit-form-grid">
              <div className="booking-edit-field">
                <label>Số lượng</label>

                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={editItemForm.quantity}
                  onChange={handleEditItemFormChange}
                />
              </div>

              <div className="booking-edit-field">
                <label>Đơn giá (VNĐ)</label>

                <input
                  type="text"
                  inputMode="numeric"
                  name="price"
                  value={formatEditMoneyInput(editItemForm.price)}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, "");

                    setEditItemForm((prev) => ({
                      ...prev,
                      price: rawValue,
                    }));
                  }}
                  placeholder="Ví dụ: 360.000"
                />
              </div>
            </div>

            <div className="booking-edit-field">
              <label>Ngày áp dụng</label>

              <input
                type="date"
                name="date"
                value={editItemForm.date}
                onChange={handleEditItemFormChange}
              />
            </div>

            <div className="booking-edit-field">
              <label>Ghi chú</label>

              <textarea
                name="note"
                value={editItemForm.note}
                onChange={handleEditItemFormChange}
                rows="3"
                placeholder="Nhập ghi chú nếu có..."
              />
            </div>

            <div className="booking-edit-modal-total">
              <span>Thành tiền</span>

              <strong>
                {formatMoney(
                  Number(editItemForm.quantity || 0) *
                    Number(editItemForm.price || 0)
                )}
              </strong>
            </div>
          </div>

          <div className="booking-edit-modal-footer">
            <button
              type="button"
              className="cancel"
              onClick={closeEditItemModal}
            >
              Hủy
            </button>

            <button
              type="button"
              className="save"
              onClick={handleSaveEditItem}
              disabled={editItemType === "extraCosts" && savingExtraCost}
            >
              {editItemType === "extraCosts" && savingExtraCost
                ? "Đang lưu..."
                : editingItem
                ? "Lưu thay đổi"
                : "Thêm hạng mục"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ================= ROOM INFORMATION =================

  const renderRoomInformation = (rooms) => {
    if (!rooms || rooms.length === 0) {
      return (
        <div className="booking-tab-empty">
          Chưa có thông tin phòng trong booking này.
        </div>
      );
    }

    return (
      <div className="booking-room-list">
        {rooms.map((room, index) => (
          <div className="booking-room-item" key={room.roomId || index}>
            <div className="booking-room-heading">
              <div>
                <span>PHÒNG {index + 1}</span>
                <h4>{room.roomNumber || "Chưa có số phòng"}</h4>
              </div>
            </div>

            <div className="booking-room-type">
              <strong>{room.roomTypeName || "Chưa xác định loại phòng"}</strong>

              <p>{room.roomTypeDescription || "Không có mô tả loại phòng."}</p>
            </div>

            {room.roomDescription && (
              <p className="booking-room-description">{room.roomDescription}</p>
            )}

            <div className="booking-room-info-grid">
              <div>
                <span>Tầng</span>
                <strong>{room.floor ?? "--"}</strong>
              </div>

              <div>
                <span>Sức chứa</span>
                <strong>{room.capacity ?? "--"} khách</strong>
              </div>

              <div>
                <span>Diện tích</span>
                <strong>{room.area != null ? `${room.area} m²` : "--"}</strong>
              </div>

              <div>
                <span>Loại giường</span>
                <strong>{room.bedType || "--"}</strong>
              </div>

              <div>
                <span>Số khách đặt</span>
                <strong>{room.guestCount ?? "--"} khách</strong>
              </div>

              <div>
                <span>Giá niêm yết</span>
                <strong>{formatMoney(room.basePrice)}</strong>
              </div>
            </div>

            <div className="booking-room-price">
              <span>Giá phòng tại thời điểm đặt</span>
              <strong>{formatMoney(room.roomPrice)}</strong>
            </div>
            {(room.discountCode || Number(room.discountAmount || 0) > 0) && (
              <div className="booking-room-discount">
                <br></br>
                <span>
                  Mã giảm giá: <strong>{room.discountCode || "--"} </strong>
                </span>
                <span>
                  -- Giảm: <strong>{formatMoney(room.discountAmount)}</strong>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // ================= MANUAL EDIT MODAL =================

  const renderManualEditModal = () => {
    if (!showManualEdit || !selectedBooking) return null;

    return (
      <div className="manual-edit-backdrop" onClick={closeManualEdit}>
        <div className="manual-edit-modal" onClick={(e) => e.stopPropagation()}>
          <div className="manual-edit-header">
            <h3>
              <i className="bi bi-exclamation-triangle"></i>
              Sửa trạng thái thủ công
            </h3>

            <button
              type="button"
              onClick={closeManualEdit}
              disabled={savingManual}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="manual-edit-body">
            {!isAdmin ? (
              <div className="manual-edit-warning">
                <i className="bi bi-exclamation-triangle"></i>

                <span>
                  Nhân viên không có quyền cập nhật trạng thái thủ công.
                </span>
              </div>
            ) : (
              <>
                <div className="manual-edit-alert">
                  Cảnh báo: Thay đổi trạng thái thủ công có thể ảnh hưởng đến
                  quy trình booking. Chỉ sử dụng khi thật sự cần thiết.
                </div>

                <div className="manual-edit-field">
                  <label>Trạng thái booking</label>

                  <select
                    name="status"
                    value={manualForm.status}
                    onChange={handleManualFormChange}
                    disabled={savingManual}
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="manual-edit-footer">
            <button
              type="button"
              className="manual-edit-cancel"
              onClick={closeManualEdit}
              disabled={savingManual}
            >
              Hủy
            </button>

            {isAdmin && (
              <button
                type="button"
                className={`manual-edit-save ${
                  manualForm.status !== selectedBooking.status ? "active" : ""
                }`}
                onClick={handleSaveManualEdit}
                disabled={
                  savingManual || manualForm.status === selectedBooking.status
                }
              >
                {savingManual ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ================= ADD PAYMENT MODAL =================

  // ================= ADD / EDIT PAYMENT MODAL =================

  const renderAddPaymentModal = () => {
    if (!showAddPayment || !selectedBooking) return null;

    const paidAmount = paymentHistory
      .filter(
        (payment) =>
          payment.paymentStatus === "PAID" && payment.id !== editingPayment?.id
      )
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);

    const finalAmount = Number(selectedBooking.finalAmount || 0);

    const remainingAmount = Math.max(0, finalAmount - paidAmount);

    return (
      <div className="manual-edit-backdrop" onClick={closeAddPayment}>
        <div
          className="manual-edit-modal booking-add-payment-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="manual-edit-header">
            <h3>
              <i className="bi bi-credit-card"></i>
              {editingPayment ? "Chỉnh sửa thanh toán" : "Thêm thanh toán"}
            </h3>

            <button
              type="button"
              onClick={closeAddPayment}
              disabled={savingPayment}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="manual-edit-body">
            <div className="booking-payment-modal-info">
              <span>Mã booking</span>
              <strong>{selectedBooking.bookingCode}</strong>
            </div>

            <div className="booking-payment-modal-info">
              <span>
                {editingPayment
                  ? "Số tiền tối đa có thể ghi nhận"
                  : "Số tiền còn phải trả"}
              </span>

              <strong className="is-pending">
                {formatMoney(remainingAmount)}
              </strong>
            </div>

            <div className="manual-edit-field">
              <label>
                Số tiền thanh toán <span>*</span>
              </label>

              <input
                type="text"
                name="amount"
                value={formatCurrencyInput(paymentForm.amount)}
                onChange={handlePaymentFormChange}
                placeholder="Ví dụ: 1.000.000"
                disabled={savingPayment}
              />

              <small>Số tiền không được vượt quá số tiền còn phải trả.</small>
            </div>

            <div className="manual-edit-field">
              <label>
                Phương thức thanh toán <span>*</span>
              </label>

              <select
                name="paymentMethod"
                value={paymentForm.paymentMethod}
                onChange={handlePaymentFormChange}
                disabled={savingPayment}
              >
                <option value="CASH_AT_HOTEL">Tiền mặt</option>

                <option value="VNPAY">VNPay</option>
              </select>
            </div>

            <div className="booking-payment-modal-note">
              <i className="bi bi-info-circle"></i>
              Chỉ các giao dịch có trạng thái Đã thanh toán mới được tính vào số
              tiền đã thu.
            </div>
          </div>

          <div className="manual-edit-footer">
            <button
              type="button"
              className="manual-edit-cancel"
              onClick={closeAddPayment}
              disabled={savingPayment}
            >
              Hủy
            </button>

            <button
              type="button"
              className="manual-edit-save active"
              onClick={handleSavePayment}
              disabled={
                savingPayment ||
                !paymentForm.amount ||
                Number(paymentForm.amount) <= 0 ||
                Number(paymentForm.amount) > remainingAmount
              }
            >
              {savingPayment
                ? "Đang lưu..."
                : editingPayment
                ? "Cập nhật thanh toán"
                : "Xác nhận thanh toán"}
            </button>
          </div>
        </div>
      </div>
    );
  };
  // ================= RENDER DETAIL MODAL =================

  const renderDetailModal = () => {
    if (detailLoading) {
      return (
        <div className="booking-modal-backdrop">
          <div className="booking-detail-modal">
            <div className="booking-loading">
              <div className="booking-spinner"></div>
              Đang tải thông tin booking...
            </div>
          </div>
        </div>
      );
    }

    if (!selectedBooking) return null;

    const booking = selectedBooking;
    const rooms = booking.rooms || [];

    const allowedStatuses = getAllowedStatuses(booking);

    const updateStatusFromDetail = async (newStatus) => {
      await confirmStatusUpdate(booking, newStatus);
    };

    return (
      <div className="booking-modal-backdrop" onClick={closeDetail}>
        <div
          className="booking-detail-modal booking-detail-modal-tabs"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}

          <div className="booking-modal-header">
            <div>
              <span>GRANDSTAY MANAGEMENT</span>

              <h3>{booking.bookingCode}</h3>

              <div className="booking-detail-header-meta">
                <span className={getStatusClass(booking.status)}>
                  {STATUS_LABELS[booking.status] || booking.status}
                </span>

                <small>Ngày tạo: {formatDateTime(booking.createdAt)}</small>
              </div>
            </div>

            <button
              className="booking-modal-close"
              onClick={closeDetail}
              type="button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* DETAIL TABS */}

          <div className="booking-detail-tabs">
            {DETAIL_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={
                  activeDetailTab === tab.id
                    ? "booking-detail-tab active"
                    : "booking-detail-tab"
                }
                onClick={() => setActiveDetailTab(tab.id)}
              >
                <i className={`bi ${tab.icon}`}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="booking-modal-body booking-tab-content">
            {/* ================= QUẢN LÝ ================= */}

            {activeDetailTab === "management" && (
              <>
                <div className="booking-tab-title">
                  <h3>Quản lý booking</h3>

                  <p>
                    Theo dõi trạng thái, thông tin lưu trú và thanh toán của đơn
                    đặt phòng.
                  </p>
                </div>

                {(() => {
                  const timeline = [
                    {
                      key: "PENDING",
                      label: "Chờ xác nhận",
                      icon: "bi-check-lg",
                    },
                    {
                      key: "CONFIRMED",
                      label: "Đã xác nhận",
                      icon: "bi-check-circle",
                    },
                    {
                      key: "CHECKED_IN",
                      label: "Đã check-in",
                      icon: "bi-calendar-event",
                    },
                    {
                      key: "COMPLETED",
                      label: "Đã check-out",
                      icon: "bi-check-lg",
                    },
                  ];

                  const timelineIndex = timeline.findIndex(
                    (item) => item.key === booking.status
                  );

                  const nights =
                    booking.checkInDate && booking.checkOutDate
                      ? Math.max(
                          0,
                          Math.round(
                            (new Date(booking.checkOutDate + "T00:00:00") -
                              new Date(booking.checkInDate + "T00:00:00")) /
                              86400000
                          )
                        )
                      : 0;

                  const roomTypes = [
                    ...new Set(
                      rooms.map((room) => room.roomTypeName).filter(Boolean)
                    ),
                  ];

                  return (
                    <>
                      {/* STATUS PANEL */}

                      <div className="booking-detail-section booking-status-panel">
                        <h4>Trạng thái booking</h4>

                        {booking.status === "CANCELED" ? (
                          <div className="booking-canceled-state">
                            <i className="bi bi-x-circle"></i>
                            <strong>Booking đã hủy</strong>
                          </div>
                        ) : (
                          <div className="booking-status-timeline">
                            <div className="booking-timeline-track">
                              <div
                                className="booking-timeline-progress"
                                style={{
                                  width: `${
                                    (Math.max(0, timelineIndex) /
                                      (timeline.length - 1)) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>

                            {timeline.map((item, index) => {
                              const completed =
                                timelineIndex >= index && timelineIndex >= 0;

                              const current = timelineIndex === index;

                              return (
                                <div
                                  className={`booking-timeline-step ${
                                    completed ? "completed" : ""
                                  } ${current ? "current" : ""}`}
                                  key={item.key}
                                >
                                  <div className="booking-timeline-icon">
                                    <i className={`bi ${item.icon}`}></i>
                                  </div>

                                  <span>{item.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* ACTION BUTTONS */}

                        <div className="booking-management-actions">
                          {/* CANCEL */}

                          {allowedStatuses.includes("CANCELED") && (
                            <button
                              className="booking-action-cancel"
                              type="button"
                              disabled={updatingStatus}
                              onClick={() => updateStatusFromDetail("CANCELED")}
                            >
                              <i className="bi bi-x-circle"></i>
                              Hủy booking
                            </button>
                          )}

                          <div className="booking-action-right">
                            {/* CONFIRM */}

                            {allowedStatuses.includes("CONFIRMED") && (
                              <button
                                className="booking-action-primary"
                                type="button"
                                disabled={updatingStatus}
                                onClick={() =>
                                  updateStatusFromDetail("CONFIRMED")
                                }
                              >
                                Xác nhận booking
                              </button>
                            )}

                            {/* CHECK-IN */}

                            {allowedStatuses.includes("CHECKED_IN") && (
                              <button
                                className="booking-action-primary"
                                type="button"
                                disabled={updatingStatus}
                                onClick={() =>
                                  updateStatusFromDetail("CHECKED_IN")
                                }
                              >
                                Check-in
                              </button>
                            )}

                            {/* CHECK-OUT */}

                            {allowedStatuses.includes("COMPLETED") && (
                              <button
                                className="booking-action-primary"
                                type="button"
                                disabled={updatingStatus}
                                onClick={() =>
                                  updateStatusFromDetail("COMPLETED")
                                }
                              >
                                Check-out
                              </button>
                            )}
                          </div>
                        </div>

                        {/* MANUAL EDIT */}

                        {isAdmin && (
                          <div className="booking-manual-edit">
                            <button
                              type="button"
                              className="booking-manual-edit-btn"
                              onClick={openManualEdit}
                            >
                              <i className="bi bi-pencil-square"></i>
                              Sửa trạng thái thủ công
                            </button>
                          </div>
                        )}
                      </div>

                      {/* BOOKING OVERVIEW */}

                      <div className="booking-detail-section">
                        <h4>
                          <i className="bi bi-card-list"></i>
                          Tổng quan booking
                        </h4>

                        <div className="booking-overview-grid">
                          <div>
                            <span>Loại phòng</span>
                            <strong>
                              {roomTypes.length ? roomTypes.join(", ") : "--"}
                            </strong>
                          </div>

                          <div>
                            <span>Ngày check-in</span>
                            <strong>{formatDate(booking.checkInDate)}</strong>
                          </div>

                          <div>
                            <span>Ngày check-out</span>
                            <strong>{formatDate(booking.checkOutDate)}</strong>
                          </div>

                          <div>
                            <span>Số đêm</span>
                            <strong>{nights} đêm</strong>
                          </div>

                          <div>
                            <span>Số khách</span>
                            <strong>{booking.guestCount ?? "--"} khách</strong>
                          </div>

                          <div>
                            <span>Số phòng</span>
                            <strong>{rooms.length} phòng</strong>
                          </div>
                        </div>
                      </div>

                      {/* PAYMENT OVERVIEW */}

                      <div className="booking-detail-section booking-payment-panel">
                        <h4>
                          <i className="bi bi-credit-card"></i>
                          Thông tin thanh toán
                        </h4>

                        <div className="booking-payment-status">
                          <span>Trạng thái thanh toán</span>

                          <strong
                            className={
                              booking.paymentStatus === "PAID"
                                ? "is-paid"
                                : booking.paymentStatus === "PARTIALLY_PAID"
                                ? "is-pending"
                                : "is-unknown"
                            }
                          >
                            {PAYMENT_STATUS_LABELS[booking.paymentStatus] ||
                              "Chưa thanh toán"}
                          </strong>
                        </div>

                        <div className="booking-payment-summary">
                          <div>
                            <span>Đã thanh toán</span>
                            <strong>{formatMoney(booking.paidAmount)}</strong>
                          </div>

                          <div>
                            <span>Còn lại</span>
                            <strong>
                              {formatMoney(booking.remainingAmount)}
                            </strong>
                          </div>

                          <div className="total">
                            <span>Tổng cộng</span>
                            <strong>{formatMoney(booking.finalAmount)}</strong>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </>
            )}

            {/* ================= KHÁCH HÀNG ================= */}

            {activeDetailTab === "customer" && (
              <>
                <div className="booking-tab-title">
                  <h3>Thông tin khách hàng</h3>
                  <p>Thông tin liên hệ của khách hàng đặt phòng.</p>
                </div>

                <div className="booking-detail-section">
                  <h4>
                    <i className="bi bi-person-circle"></i>
                    Thông tin liên hệ
                  </h4>

                  <div className="booking-detail-grid">
                    <div>
                      <span>Họ và tên</span>
                      <strong>{booking.customerName || "--"}</strong>
                    </div>

                    <div>
                      <span>Số điện thoại</span>
                      <strong>{booking.customerPhone || "--"}</strong>
                    </div>

                    <div>
                      <span>Email</span>
                      <strong>{booking.customerEmail || "--"}</strong>
                    </div>

                    <div>
                      <span>Ngày tạo booking</span>
                      <strong>{formatDateTime(booking.createdAt)}</strong>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ================= LƯU TRÚ ================= */}

            {activeDetailTab === "stay" && (
              <>
                <div className="booking-tab-title">
                  <h3>Thông tin lưu trú</h3>
                  <p>Thời gian lưu trú và danh sách phòng đã đặt.</p>
                </div>

                <div className="booking-detail-section">
                  <h4>
                    <i className="bi bi-calendar-range"></i>
                    Thời gian lưu trú
                  </h4>

                  <div className="booking-detail-grid">
                    <div>
                      <span>Ngày nhận phòng</span>
                      <strong>{formatDate(booking.checkInDate)}</strong>
                    </div>

                    <div>
                      <span>Ngày trả phòng</span>
                      <strong>{formatDate(booking.checkOutDate)}</strong>
                    </div>

                    <div>
                      <span>Tổng số khách</span>
                      <strong>{booking.guestCount ?? 0} khách</strong>
                    </div>

                    <div>
                      <span>Số phòng</span>
                      <strong>{rooms.length} phòng</strong>
                    </div>
                  </div>
                </div>

                <div className="booking-detail-section">
                  <h4>
                    <i className="bi bi-door-open"></i>
                    Danh sách phòng
                  </h4>

                  {renderRoomInformation(rooms)}
                </div>
              </>
            )}

            {/* ================= THANH TOÁN ================= */}

            {activeDetailTab === "payment" &&
              (() => {
                const paidAmount = paymentHistory
                  .filter((payment) => payment.paymentStatus === "PAID")
                  .reduce(
                    (total, payment) => total + Number(payment.amount || 0),
                    0
                  );

                const finalAmount = Number(booking.finalAmount || 0);

                const remainingAmount = Math.max(0, finalAmount - paidAmount);

                return (
                  <>
                    <div className="booking-tab-title booking-payment-heading">
                      <div>
                        <h3>Thông tin thanh toán</h3>
                        <p>
                          Theo dõi các khoản thanh toán và lịch sử giao dịch của
                          booking.
                        </p>
                      </div>

                      {isAdmin && (
                        <button
                          type="button"
                          className="booking-add-payment-btn"
                          onClick={openAddPayment}
                          disabled={remainingAmount <= 0}
                        >
                          <i className="bi bi-plus-lg"></i>
                          Thêm thanh toán
                        </button>
                      )}
                    </div>

                    {/* TÌNH TRẠNG THANH TOÁN */}

                    <div className="booking-payment-summary booking-payment-summary-detail">
                      <div>
                        <span>Đã thanh toán</span>
                        <strong className="is-paid">
                          {formatMoney(paidAmount)}
                        </strong>
                      </div>

                      <div>
                        <span>Còn phải trả</span>
                        <strong className="is-pending">
                          {formatMoney(remainingAmount)}
                        </strong>
                      </div>

                      <div className="total">
                        <span>Tổng cộng</span>
                        <strong>{formatMoney(finalAmount)}</strong>
                      </div>
                    </div>

                    {/* LỊCH SỬ GIAO DỊCH */}

                    <div className="booking-detail-section">
                      <div className="booking-payment-history-heading">
                        <div>
                          <h4>
                            <i className="bi bi-clock-history"></i>
                            Lịch sử giao dịch
                          </h4>

                          <p>{paymentHistory.length} giao dịch</p>
                        </div>
                      </div>

                      {paymentLoading ? (
                        <div className="booking-loading">
                          <div className="booking-spinner"></div>
                          Đang tải lịch sử thanh toán...
                        </div>
                      ) : paymentHistory.length === 0 ? (
                        <div className="booking-tab-empty">
                          <i className="bi bi-credit-card"></i>
                          Chưa có giao dịch thanh toán nào.
                        </div>
                      ) : (
                        <div className="booking-payment-table-wrapper">
                          <table className="booking-payment-table">
                            <thead>
                              <tr>
                                <th>Mã giao dịch</th>
                                <th>Số tiền</th>
                                <th>Phương thức</th>
                                <th>Trạng thái</th>
                                <th>Ngày tạo</th>
                                <th>Ngày thanh toán</th>
                                {isAdmin && <th>Thao tác</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {paymentHistory.map((payment) => (
                                <tr key={payment.id}>
                                  <td>
                                    <strong>
                                      {payment.paymentReference || "--"}
                                    </strong>
                                  </td>

                                  <td>
                                    <strong className="booking-money">
                                      {formatMoney(payment.amount)}
                                    </strong>
                                  </td>

                                  <td>
                                    {payment.paymentMethod === "VNPAY"
                                      ? "VNPay"
                                      : payment.paymentMethod ===
                                        "CASH_AT_HOTEL"
                                      ? "Tiền mặt"
                                      : payment.paymentMethod || "--"}
                                  </td>

                                  <td>
                                    <span
                                      className={`booking-payment-status-tag payment-${(
                                        payment.paymentStatus || ""
                                      ).toLowerCase()}`}
                                    >
                                      {PAYMENT_STATUS_LABELS[
                                        payment.paymentStatus
                                      ] ||
                                        payment.paymentStatus ||
                                        "--"}
                                    </span>
                                  </td>

                                  <td>{formatDateTime(payment.createdAt)}</td>

                                  <td>{formatDateTime(payment.paidAt)}</td>

                                  {isAdmin && (
                                    <td>
                                      <button
                                        type="button"
                                        className="booking-icon-btn"
                                        title="Chỉnh sửa thanh toán"
                                        onClick={() => openEditPayment(payment)}
                                      >
                                        <i className="bi bi-pencil-square"></i>
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

            {/* ================= CHỈNH SỬA ================= */}

            {activeDetailTab === "edit" && (
              <div className="booking-edit-tab">
                <div className="booking-tab-title">
                  <h3>Chỉnh sửa booking</h3>
                  <p>
                    Quản lý phòng, sản phẩm menu, chi phí phát sinh và các dịch
                    vụ đi kèm booking.
                  </p>
                </div>

                {/* CHI PHÍ PHÁT SINH */}

                <div className="booking-edit-section extra-cost-section">
                  <div className="booking-edit-section-header">
                    <div>
                      <i className="bi bi-exclamation-circle"></i>
                      <strong>Chi phí phát sinh</strong>
                    </div>

                    <button
                      type="button"
                      className="booking-edit-add-btn orange"
                      onClick={() => openEditItemModal("extraCosts")}
                    >
                      <i className="bi bi-plus-lg"></i>
                      Thêm
                    </button>
                  </div>

                  {extraCostLoading ? (
                    <div className="booking-edit-empty">
                      <div className="booking-spinner"></div>
                      Đang tải chi phí phát sinh...
                    </div>
                  ) : extraCosts.length === 0 ? (
                    <div className="booking-edit-empty">
                      Chưa có chi phí phát sinh
                    </div>
                  ) : (
                    <div className="booking-edit-table-wrapper">
                      <table className="booking-edit-table">
                        <thead>
                          <tr>
                            <th>Mục</th>
                            <th>SL</th>
                            <th>Ngày</th>
                            <th>Thành tiền</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>

                        <tbody>
                          {extraCosts.map((item) => (
                            <tr key={item.id}>
                              {/* TÊN CHI PHÍ */}
                              <td>
                                <strong>{item.name}</strong>

                                {item.description && (
                                  <small>{item.description}</small>
                                )}

                                {item.note && <small>{item.note}</small>}
                              </td>

                              {/* SỐ LƯỢNG */}
                              <td>{item.quantity}</td>

                              {/* NGÀY */}
                              <td>{formatDate(item.incurredDate)}</td>

                              {/* THÀNH TIỀN */}
                              <td className="booking-edit-money">
                                {formatMoney(item.totalAmount)}
                              </td>

                              {/* THAO TÁC */}
                              <td className="booking-room-actions-cell">
                                <div className="booking-edit-actions">
                                  <button
                                    type="button"
                                    className="booking-edit-action-btn"
                                    onClick={() =>
                                      openEditItemModal("extraCosts", item)
                                    }
                                  >
                                    <i className="bi bi-pencil-square"></i>
                                    <span>Thay đổi</span>
                                  </button>

                                  <button
                                    type="button"
                                    className="booking-edit-action-btn delete"
                                    onClick={() =>
                                      handleDeleteEditItem("extraCosts", item)
                                    }
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* PHÒNG */}

                <div className="booking-edit-section">
                  <div className="booking-edit-section-header">
                    <div>
                      <i className="bi bi-tent"></i>
                      <strong>Hạng Phòng</strong>
                    </div>

                    <button
                      type="button"
                      className="booking-edit-add-btn"
                      onClick={openAddRoomModal}
                    >
                      <i className="bi bi-plus-lg"></i>
                      Thêm phòng
                    </button>
                  </div>

                  {rooms.length === 0 ? (
                    <div className="booking-edit-empty">
                      Booking này chưa có phòng.
                    </div>
                  ) : (
                    <div className="booking-edit-table-wrapper">
                      <table className="booking-edit-table">
                        <thead>
                          <tr>
                            <th>Mục</th>
                            <th>SL</th>
                            <th>Ngày</th>
                            <th>Thành tiền</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>

                        <tbody>
                          {rooms.map((room, index) => {
                            const checkIn =
                              room.checkInDate || booking.checkInDate;
                            const checkOut =
                              room.checkOutDate || booking.checkOutDate;

                            const nights =
                              checkIn && checkOut
                                ? Math.max(
                                    0,
                                    Math.round(
                                      (new Date(checkOut + "T00:00:00") -
                                        new Date(checkIn + "T00:00:00")) /
                                        86400000
                                    )
                                  )
                                : 0;

                            const roomPrice = Number(room.roomPrice || 0);
                            const roomTotal = roomPrice * nights;

                            const roomDiscount = Number(
                              room.discountAmount || 0
                            );

                            const roomFinalTotal = Math.max(
                              0,
                              roomTotal - roomDiscount
                            );

                            return (
                              <tr key={room.id || room.roomId || index}>
                                {/* TÊN PHÒNG */}
                                <td>
                                  <strong>
                                    {room.roomTypeName || ""}{" "}
                                    {room.roomNumber ||
                                      room.roomTypeName ||
                                      "Chưa xác định phòng"}
                                  </strong>

                                  <small>
                                    Người lớn:{" "}
                                    {room.guestCount ?? booking.guestCount ?? 0}
                                  </small>
                                </td>

                                {/* SỐ LƯỢNG */}
                                <td>
                                  {room.guestCount ?? booking.guestCount ?? 0}{" "}
                                  khách
                                </td>

                                {/* NGÀY */}
                                <td>
                                  <div>
                                    {formatDate(checkIn)} -{" "}
                                    {formatDate(checkOut)}
                                  </div>

                                  <small>{nights} đêm</small>
                                </td>

                                {/* THÀNH TIỀN */}
                                <td className="booking-edit-money">
                                  <div className="room-price-detail">
                                    {roomDiscount > 0 ? (
                                      <>
                                        <small className="room-original-price">
                                          {formatMoney(roomTotal)}
                                        </small>

                                        <strong className="room-discounted-price">
                                          {formatMoney(roomFinalTotal)}
                                        </strong>
                                      </>
                                    ) : (
                                      <strong>{formatMoney(roomTotal)}</strong>
                                    )}
                                  </div>
                                </td>

                                {/* THAO TÁC */}
                                <td className="booking-room-actions-cell">
                                  <div className="booking-edit-actions">
                                    <button
                                      type="button"
                                      className="booking-edit-action-btn"
                                      onClick={() => openEditRoomModal(room)}
                                    >
                                      <i className="bi bi-pencil-square"></i>
                                      <span>Thay đổi</span>
                                    </button>

                                    {selectedBooking?.rooms?.length > 1 && (
                                      <button
                                        type="button"
                                        className="booking-edit-action-btn delete"
                                        onClick={() =>
                                          handleDeleteBookingRoom(room)
                                        }
                                      >
                                        <i className="bi bi-trash"></i>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= GHI CHÚ ================= */}

            {activeDetailTab === "notes" && (
              <>
                <div className="booking-tab-title">
                  <h3>Ghi chú booking</h3>
                  <p>Quản lý các ghi chú của đơn đặt phòng.</p>
                </div>

                <div className="booking-note-section">
                  {/* TIÊU ĐỀ */}
                  <div className="booking-note-title">
                    <i className="bi bi-journal-text"></i>
                    <span>
                      {editingNote ? "Chỉnh sửa ghi chú" : "Thêm ghi chú mới"}
                    </span>
                  </div>

                  {/* FORM NHẬP GHI CHÚ */}
                  {/* FORM NHẬP GHI CHÚ */}
                  <div className="booking-note-form">
                    <textarea
                      className="booking-note-textarea"
                      placeholder="Nhập nội dung ghi chú cho đơn đặt phòng..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={4}
                      disabled={savingNote}
                    />

                    <div className="booking-note-form-actions">
                      {editingNote && (
                        <button
                          type="button"
                          className="booking-note-cancel"
                          onClick={() => {
                            setNoteContent("");
                            setEditingNote(false);
                          }}
                          disabled={savingNote}
                        >
                          <i className="bi bi-x-lg"></i>
                          Hủy
                        </button>
                      )}

                      <button
                        type="button"
                        className="booking-note-save"
                        onClick={handleSaveBookingNote}
                        disabled={savingNote || !noteContent.trim()}
                      >
                        {savingNote ? (
                          <>
                            <i className="bi bi-hourglass-split"></i>
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <i
                              className={`bi ${
                                editingNote ? "bi-check2" : "bi-plus-lg"
                              }`}
                            ></i>
                            {editingNote ? "Cập nhật ghi chú" : "Lưu ghi chú"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* NỘI DUNG GHI CHÚ HIỆN TẠI */}
                  {selectedBooking?.note?.trim() &&
                    selectedBooking.note.trim().toLowerCase() !== "null" && (
                      <div className="booking-note-current">
                        {/* HEADER */}
                        <div className="booking-note-current-header">
                          <div className="booking-note-current-title">
                            <i className="bi bi-sticky"></i>
                            <span>Nội dung hiện tại</span>
                          </div>

                          {/* NÚT CHỈNH SỬA / XÓA */}
                          <div className="booking-note-actions">
                            <button
                              type="button"
                              className="booking-note-icon edit"
                              title="Chỉnh sửa ghi chú"
                              onClick={handleEditBookingNote}
                              disabled={savingNote}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>

                            <button
                              type="button"
                              className="booking-note-icon delete"
                              title="Xóa ghi chú"
                              onClick={handleDeleteBookingNote}
                              disabled={savingNote}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>

                        {/* NỘI DUNG */}
                        <div className="booking-note-content">
                          {(selectedBooking.note || "").replace(/\\n/g, "\n")}
                        </div>
                      </div>
                    )}
                </div>
              </>
            )}

            {/* ================= BILL ================= */}

            {activeDetailTab === "bill" &&
              (() => {
                const billRooms = Array.isArray(rooms) ? rooms : [];
                const billExtraCosts = Array.isArray(extraCosts)
                  ? extraCosts
                  : [];


                const finalAmount = Number(booking.finalAmount || 0);

                const calculateNights = (checkIn, checkOut) => {
                  if (!checkIn || !checkOut) return 0;

                  return Math.max(
                    0,
                    Math.round(
                      (new Date(`${checkOut}T00:00:00`) -
                        new Date(`${checkIn}T00:00:00`)) /
                        86400000
                    )
                  );
                };

                const extraCostTotal = billExtraCosts.reduce(
                  (total, item) => total + Number(item.totalAmount || 0),
                  0
                );

                return (
                  <div className="booking-bill">
                    <div className="booking-bill-heading">
                      <div>
                        <h3>Hóa đơn đặt phòng</h3>
      
                      </div>

                      <button
                        type="button"
                        className="booking-bill-print-btn"
                        onClick={() => window.print()}
                      >
                        <i className="bi bi-printer"></i>
                        In hóa đơn
                      </button>
                    </div>
                    <div className="booking-bill-layout">
                      {/* CHI TIẾT PHÒNG */}
                      <div className="booking-bill-section">
                        <h4>Chi tiết dịch vụ</h4>

                        <div className="booking-bill-table-wrapper">
                          <table className="booking-bill-table">
                            <thead>
                              <tr>
                                <th>Phòng</th>
                                <th>Thời gian</th>
                                <th>Đơn giá</th>
                                <th>Thành tiền</th>
                              </tr>
                            </thead>

                            <tbody>
                              {billRooms.map((room, index) => {
                                const checkIn =
                                  room.checkInDate || booking.checkInDate;
                                const checkOut =
                                  room.checkOutDate || booking.checkOutDate;
                                const nights = calculateNights(
                                  checkIn,
                                  checkOut
                                );

                                const unitPrice = Number(room.roomPrice || 0);
                                const roomTotal = unitPrice * nights;
                                const discount = Number(
                                  room.discountAmount || 0
                                );
                                const total = Math.max(0, roomTotal - discount);

                                return (
                                  <tr
                                    key={room.bookingRoomId || room.id || index}
                                  >
                                    <td>
                                      <strong>
                                        {room.roomTypeName || "Phòng"}{" "}
                                        {room.roomNumber || ""}
                                      </strong>
                                    </td>

                                    <td>
                                      {formatDate(checkIn)} -{" "}
                                      {formatDate(checkOut)}
                                      <small>{nights} đêm</small>
                                    </td>

                                    <td>{formatMoney(unitPrice)}</td>

                                    <td>
                                      <strong>{formatMoney(total)}</strong>
                                    </td>
                                  </tr>
                                );
                              })}

                              {billExtraCosts.map((item) => (
                                <tr key={`extra-${item.id}`}>
                                  <td>
                                    <strong>{item.name}</strong>
                                    <small>Chi phí phát sinh</small>
                                  </td>
                                  <td>{formatDate(item.incurredDate)}</td>
                                  <td>{formatMoney(item.unitPrice)}</td>
                                  <td>
                                    <strong>
                                      {formatMoney(item.totalAmount)}
                                    </strong>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* TỔNG THANH TOÁN */}
                      <div className="booking-bill-summary">
                        <h4>Tổng kết thanh toán</h4>
                        <div className="booking-bill-total-box">
                          <div className="booking-bill-total-row">
                            <span>Tổng tiền phòng và dịch vụ</span>
                            <strong>
                              {formatMoney(
                                Number(booking.totalAmount || 0) +
                                  extraCostTotal
                              )}
                            </strong>
                          </div>

                          <div className="booking-bill-total-row">
                            <span>Giảm giá</span>
                            <strong>
                              - {formatMoney(booking.discountAmount || 0)}
                            </strong>
                          </div>

                          <div className="booking-bill-total-row final">
                            <span>Tổng thanh toán</span>
                            <strong>{formatMoney(finalAmount)}</strong>
                          </div>

                          <div className="booking-bill-total-row paid">
                            <span>Đã thanh toán</span>
                            <strong>{formatMoney(booking.paidAmount)}</strong>
                          </div>

                          <div className="booking-bill-total-row remaining">
                            <span>Còn cần trả</span>
                            <strong>{formatMoney(booking.remainingAmount)}</strong>
                          </div>

                        
                        </div>
                      </div>
                    </div>


{/* LAYOUT RIÊNG DÀNH CHO IN HÓA ĐƠN */}
<div className="booking-invoice-print">

<div className="invoice-header">
  <h1>GRANDSTAY</h1>
  <p>HOTEL & RESORT</p>
  <h2>HÓA ĐƠN THANH TOÁN</h2>
  <span>BOOKING INVOICE</span>
</div>

<div className="invoice-booking-info">
  <div>
    <span>Mã đặt phòng:</span>
    <strong>{booking.bookingCode || "--"}</strong>
  </div>
  <div>
  <span>Khách hàng:</span>
  <strong>{booking.customerName || "--"}</strong>
</div>

<div>
  <span>Số điện thoại:</span>
  <strong>{booking.customerPhone || "--"}</strong>
</div>

<div>
  <span>Email:</span>
  <strong>{booking.customerEmail || "--"}</strong>
</div>
  <div>
    <span>Ngày nhận phòng:</span>
    <strong>{formatDate(booking.checkInDate)}</strong>
  </div>
  <div>
    <span>Ngày trả phòng:</span>
    <strong>{formatDate(booking.checkOutDate)}</strong>
  </div>
</div>

<h3 className="invoice-section-title">CHI TIẾT DỊCH VỤ</h3>

<table className="invoice-table">
  <thead>
    <tr>
      <th>STT</th>
      <th>Nội dung</th>
      <th>Thời gian</th>
      <th>Đơn giá</th>
      <th>Thành tiền</th>
    </tr>
  </thead>
  <tbody>
    {rooms.map((room, index) => {
      const checkIn = room.checkInDate || booking.checkInDate;
      const checkOut = room.checkOutDate || booking.checkOutDate;

      const nights = Math.max(
        0,
        Math.round(
          (new Date(`${checkOut}T00:00:00`) -
            new Date(`${checkIn}T00:00:00`)) / 86400000
        )
      );

      const total = Math.max(
        0,
        Number(room.roomPrice || 0) * nights -
        Number(room.discountAmount || 0)
      );

      return (
        <tr key={room.bookingRoomId || room.id || index}>
          <td>{index + 1}</td>
          <td>
            {room.roomTypeName || "Phòng"} {room.roomNumber || ""}
          </td>
          <td>{nights} đêm</td>
          <td>{formatMoney(room.roomPrice)}</td>
          <td>{formatMoney(total)}</td>
        </tr>
      );
    })}

    {extraCosts.map((item, index) => (
      <tr key={`invoice-extra-${item.id || index}`}>
        <td>{rooms.length + index + 1}</td>
        <td>{item.name || "Chi phí phát sinh"}</td>
        <td>{formatDate(item.incurredDate)}</td>
        <td>{formatMoney(item.unitPrice)}</td>
        <td>{formatMoney(item.totalAmount)}</td>
      </tr>
    ))}
  </tbody>
</table>

<div className="invoice-payment-summary">
  <div>
    <span>Tổng tiền:</span>
    <strong>{formatMoney(booking.totalAmount)}</strong>
  </div>
  <div>
    <span>Giảm giá:</span>
    <strong>- {formatMoney(booking.discountAmount)}</strong>
  </div>
  <div className="invoice-final">
    <span>TỔNG THANH TOÁN:</span>
    <strong>{formatMoney(booking.finalAmount)}</strong>
  </div>
  <div>
    <span>Đã thanh toán:</span>
    <strong>{formatMoney(booking.paidAmount)}</strong>
  </div>
  <div className="invoice-remaining">
    <span>Còn cần trả:</span>
    <strong>{formatMoney(booking.remainingAmount)}</strong>
  </div>
</div>

<div className="invoice-thank-you">
  <strong>CẢM ƠN QUÝ KHÁCH ĐÃ LỰA CHỌN GRANDSTAY!</strong>
  <p>Kính chúc Quý khách có một kỳ nghỉ tuyệt vời.</p>
</div>

</div>

                  </div>
                );
              })()}
          </div>

          {/* FOOTER */}

          <div className="booking-modal-footer">
            <button
              className="booking-modal-secondary"
              onClick={closeDetail}
              type="button"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ================= MAIN UI =================

  return (
    <div className="booking-management">
      {/* PAGE HEADING */}

      <div className="booking-page-heading">
        <div>
          <span className="booking-eyebrow">GRANDSTAY MANAGEMENT</span>

          <h2>Quản lý đặt phòng</h2>

          <p>Theo dõi và quản lý tất cả các đơn đặt phòng của khách hàng.</p>
        </div>

        <button
          className="booking-refresh-btn"
          onClick={handleRefresh}
          disabled={loading}
          type="button"
        >
          <i className="bi bi-arrow-clockwise"></i>
          Làm mới
        </button>
      </div>

      {/* STATISTICS */}

      <div className="booking-stat-grid">
        <div className="booking-stat-card">
          <div className="booking-stat-icon navy">
            <i className="bi bi-calendar-check"></i>
          </div>

          <div>
            <span>Tổng booking</span>
            <strong>{totalBookings}</strong>
          </div>
        </div>

        <div className="booking-stat-card">
          <div className="booking-stat-icon orange">
            <i className="bi bi-clock-history"></i>
          </div>

          <div>
            <span>Chờ xác nhận</span>
            <strong>{pendingBookings}</strong>
          </div>
        </div>

        <div className="booking-stat-card">
          <div className="booking-stat-icon blue">
            <i className="bi bi-check-circle"></i>
          </div>

          <div>
            <span>Đã xác nhận</span>
            <strong>{confirmedBookings}</strong>
          </div>
        </div>

        <div className="booking-stat-card">
          <div className="booking-stat-icon green">
            <i className="bi bi-house-check"></i>
          </div>

          <div>
            <span>Đang lưu trú</span>
            <strong>{checkedInBookings}</strong>
          </div>
        </div>

        <div className="booking-stat-card">
          <div className="booking-stat-icon gray">
            <i className="bi bi-check2-all"></i>
          </div>

          <div>
            <span>Hoàn thành</span>
            <strong>{completedBookings}</strong>
          </div>
        </div>

        <div className="booking-stat-card">
          <div className="booking-stat-icon red">
            <i className="bi bi-x-circle"></i>
          </div>

          <div>
            <span>Đã hủy</span>
            <strong>{canceledBookings}</strong>
          </div>
        </div>
      </div>

      {/* FILTER */}

      <div className="booking-filter-card">
        <div className="booking-filter-heading">
          <div>
            <i className="bi bi-funnel"></i>
            <strong>Tìm kiếm và lọc booking</strong>
          </div>
        </div>

        <div className="booking-filter-grid">
          <div className="booking-filter-field keyword-field">
            <label>Tìm kiếm booking</label>

            <div className="booking-search-input">
              <i className="bi bi-search"></i>

              <input
                type="text"
                placeholder="Nhập mã booking, tên, email, số điện thoại..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>

          <div className="booking-filter-field">
            <label>Trạng thái</label>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="CHECKED_IN">Đang lưu trú</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="CANCELED">Đã hủy</option>
            </select>
          </div>

          <div className="booking-filter-field">
            <label>Ngày nhận phòng</label>

            <input
              type="date"
              name="checkInDate"
              value={filters.checkInDate}
              onChange={handleFilterChange}
            />
          </div>
        </div>

        <div className="booking-filter-actions">
          <button
            className="booking-reset-btn"
            onClick={handleResetFilters}
            type="button"
          >
            <i className="bi bi-arrow-counterclockwise"></i>
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* BOOKING TABLE */}

      <div className="booking-table-card">
        <div className="booking-table-heading">
          <div>
            <h3>Danh sách đặt phòng</h3>

            <p>Danh sách booking theo điều kiện tìm kiếm hiện tại.</p>
          </div>

          <span className="booking-result-count">
            {bookings.length} booking
          </span>
        </div>

        {error && (
          <div className="booking-error">
            <i className="bi bi-exclamation-circle"></i>
            {error}
          </div>
        )}

        {loading ? (
          <div className="booking-loading">
            <div className="booking-spinner"></div>
            Đang tải danh sách booking...
          </div>
        ) : bookings.length === 0 ? (
          <div className="booking-empty">
            <i className="bi bi-calendar-x"></i>

            <strong>Không tìm thấy booking</strong>

            <span>Không có booking phù hợp với điều kiện tìm kiếm.</span>
          </div>
        ) : (
          <>
            <div className="booking-table-wrapper">
              <table className="booking-table">
                <thead>
                  <tr>
                    <th>Mã booking</th>
                    <th>Khách hàng</th>
                    <th>Ngày nhận</th>
                    <th>Ngày trả</th>
                    <th>Số khách</th>
                    <th>Nguồn</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {currentBookings.map((booking) => {
                    const source = getSourceLabel(booking.source);

                    return (
                      <tr key={booking.id}>
                        <td>
                          <strong className="booking-code">
                            {booking.bookingCode}
                          </strong>

                          <small>{formatDateTime(booking.createdAt)}</small>
                        </td>

                        <td>
                          <strong>{booking.customerName || "--"}</strong>

                          <small>{booking.customerEmail}</small>

                          <small>{booking.customerPhone}</small>
                        </td>

                        <td>{formatDate(booking.checkInDate)}</td>

                        <td>{formatDate(booking.checkOutDate)}</td>

                        <td>{booking.guestCount || 0} khách</td>
                        <td>
                          <span
                            className={`booking-source source-${source.toLowerCase()}`}
                          >
                            <i
                              className={
                                source === "WEB"
                                  ? "bi bi-globe"
                                  : source === "ADMIN"
                                  ? "bi bi-shield-check"
                                  : "bi bi-person-badge"
                              }
                            ></i>

                            {source}
                          </span>
                        </td>
                        <td>
                          <strong className="booking-money">
                            {formatMoney(booking.finalAmount)}
                          </strong>
                        </td>

                        <td>
                          <span className={getStatusClass(booking.status)}>
                            {STATUS_LABELS[booking.status] || booking.status}
                          </span>
                        </td>

                        <td>
                          <div className="booking-actions">
                            {/* VIEW DETAIL */}

                            <button
                              className="booking-icon-btn view"
                              title="Xem chi tiết"
                              type="button"
                              onClick={() => handleViewDetail(booking.id)}
                            >
                              <i className="bi bi-eye"></i>
                            </button>

                            {/* UPDATE STATUS */}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}

            <div className="booking-pagination">
              <span>
                Hiển thị {startIndex + 1} -{" "}
                {Math.min(startIndex + PAGE_SIZE, bookings.length)} trong tổng
                số {bookings.length} booking
              </span>

              <div className="booking-pagination-actions">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  title="Trang trước"
                >
                  <i className="bi bi-chevron-left"></i>
                </button>

                <span>
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  title="Trang sau"
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {/* DETAIL MODAL */}

      {renderDetailModal()}

      {/* MANUAL EDIT MODAL */}

      {renderManualEditModal()}
      {renderEditItemModal()}

      {/* ADD PAYMENT MODAL */}

      {renderAddPaymentModal()}

      {renderAddRoomModal()}
    </div>
  );
}

export default BookingManagement;
