
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import BookingHistory from "./pages/BookingHistory";
import BookingDetail from "./pages/BookingDetail";
import RoomSelection from "./pages/RoomSelection";
import BookingConfirm from "./pages/BookingConfirm";
import PaymentOptions from "./components/PaymentOptions";   
import PaymentResult from "./pages/PaymentResult";
import PaymentHistory from "./pages/PaymentHistory";
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/rooms" element={<RoomSelection />} />
                <Route path="/payment-options/:bookingId" element={<PaymentOptions />} />
                <Route path="/payment-result" element={<PaymentResult />} />
                <Route
                    path="/booking-history"
                    element={<BookingHistory />}
                />
                <Route
                    path="/booking-history/:id"
                    element={<BookingDetail />}
                />
                
                <Route path="/booking-confirm" element={<BookingConfirm />} />    
                <Route
    path="/payment-history"
    element={<PaymentHistory />}
/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
