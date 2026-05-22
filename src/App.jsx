import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
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
import Insights from './pages/admin/Insights'
import PrivacyPolicy from './pages/PrivacyPolicy'
import ScrollToTop from './components/ScrollToTop'

function AdminRoute({ children }) {
  const authed = sessionStorage.getItem('mama_admin') === '1'
  return authed ? children : <Navigate to="/admin/login" replace />
}

function AppLayout() {
  const { pathname } = useLocation()

  // Show footer on public informational pages; not on order flow or admin
  const showFooter = !pathname.startsWith('/admin') &&
                     !pathname.startsWith('/order') &&
                     !pathname.startsWith('/confirmation')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ScrollToTop />
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/"                    element={<Home />} />
          <Route path="/menu"                element={<Menu />} />
          <Route path="/order"               element={<Order />} />
          <Route path="/order-status/:id"    element={<OrderStatus />} />
          {/* <Route path="/payment" element={<Payment />} /> */}
          <Route path="/confirmation"        element={<Confirmation />} />
          <Route path="/privacy"             element={<PrivacyPolicy />} />
          <Route path="/about"               element={<About />} />

          <Route path="/admin/login"         element={<AdminLogin />} />
          <Route path="/admin"               element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/admin/menu"          element={<AdminRoute><MenuEditor /></AdminRoute>} />
          <Route path="/admin/orders/:id"    element={<AdminRoute><OrderDetail /></AdminRoute>} />
          <Route path="/admin/insights"     element={<AdminRoute><Insights /></AdminRoute>} />
        </Routes>
      </main>
      {showFooter && <Footer />}
    </div>
  )
}

export default function App() {
  return <AppLayout />
}
