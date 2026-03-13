import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Order from './pages/Order'
import OrderStatus from './pages/OrderStatus'
// import Payment from './pages/Payment'   // Stripe disabled — using Zelle/CashApp
import Confirmation from './pages/Confirmation'
import About from './pages/About'
import AdminLogin from './pages/admin/AdminLogin'
import Dashboard from './pages/admin/Dashboard'
import OrderDetail from './pages/admin/OrderDetail'
import MenuEditor from './pages/admin/MenuEditor'
import ScrollToTop from './components/ScrollToTop'

function AdminRoute({ children }) {
  const authed = sessionStorage.getItem('mama_admin') === '1'
  return authed ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/"                    element={<Home />} />
        <Route path="/menu"                element={<Menu />} />
        <Route path="/order"               element={<Order />} />
        <Route path="/order-status/:id"    element={<OrderStatus />} />
        {/* <Route path="/payment" element={<Payment />} /> */}
        <Route path="/confirmation"        element={<Confirmation />} />
        <Route path="/about"               element={<About />} />

        <Route path="/admin/login"         element={<AdminLogin />} />
        <Route path="/admin"               element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/menu"          element={<AdminRoute><MenuEditor /></AdminRoute>} />
        <Route path="/admin/orders/:id"    element={<AdminRoute><OrderDetail /></AdminRoute>} />
      </Routes>
    </>
  )
}
