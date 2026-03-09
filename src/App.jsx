import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Order from './pages/Order'
import Payment from './pages/Payment'
import Confirmation from './pages/Confirmation'
import About from './pages/About'
import AdminLogin from './pages/admin/AdminLogin'
import Dashboard from './pages/admin/Dashboard'
import OrderDetail from './pages/admin/OrderDetail'
import MenuEditor from './pages/admin/MenuEditor'

// Simple session-based admin guard
function AdminRoute({ children }) {
  const authed = sessionStorage.getItem('mama_admin') === '1'
  return authed ? children : <Navigate to="/admin/login" replace />
}

import ScrollToTop from './components/ScrollToTop'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/"             element={<Home />} />
        <Route path="/menu"         element={<Menu />} />
        <Route path="/order"        element={<Order />} />
        <Route path="/payment"      element={<Payment />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/about"        element={<About />} />

        {/* Admin login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected admin routes */}
        <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/menu" element={<AdminRoute><MenuEditor /></AdminRoute>} />
        <Route path="/admin/:id" element={<AdminRoute><OrderDetail /></AdminRoute>} />
      </Routes>
    </>
  )
}
