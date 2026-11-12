
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Script from "./components/Script";
import AdminLayout from "./pages/AdminLayout";
import Dashboard from "./pages/Dashboard";
import BookingManagement from "./pages/BookingManagement";
function App() {
    return (
        <BrowserRouter>
        <Script />
            <Routes>
            <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<Dashboard />} />
    <Route path="bookings" element={<BookingManagement />} />
</Route>
                
            </Routes>
        </BrowserRouter>
    );
}

export default App;
