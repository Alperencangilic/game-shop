import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Footer from './components/Footer.jsx';
import Navbar from './components/Navbar.jsx';
import OfflineBanner from './components/OfflineBanner.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Account from './pages/Account.jsx';
import Cart from './pages/Cart.jsx';
import Downloads from './pages/Downloads.jsx';
import GameDetail from './pages/GameDetail.jsx';
import Library from './pages/Library.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import Orders from './pages/Orders.jsx';
import Register from './pages/Register.jsx';
import Store from './pages/Store.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Activity from './pages/admin/Activity.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import ManageGames from './pages/admin/ManageGames.jsx';
import Promotions from './pages/admin/Promotions.jsx';
import Reports from './pages/admin/Reports.jsx';
import Users from './pages/admin/Users.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const customer = (page) => <ProtectedRoute permission="store.purchase">{page}</ProtectedRoute>;
  const staff = (permission, page) => <ProtectedRoute permission={permission}>{page}</ProtectedRoute>;

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <OfflineBanner />
      <main className="container main">
        <Routes>
          <Route path="/" element={<Store />} />
          <Route path="/games/:id" element={<GameDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={customer(<Cart />)} />
          <Route path="/library" element={customer(<Library />)} />
          <Route path="/downloads" element={customer(<Downloads />)} />
          <Route path="/orders" element={customer(<Orders />)} />
          <Route path="/wishlist" element={customer(<Wishlist />)} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

          <Route path="/admin" element={staff('backoffice.access', <AdminLayout />)}>
            <Route index element={<Dashboard />} />
            <Route path="games" element={staff('games.manage', <ManageGames />)} />
            <Route path="promotions" element={staff('promotions.manage', <Promotions />)} />
            <Route path="orders" element={staff('orders.view', <AdminOrders />)} />
            <Route path="reports" element={staff('reports.view', <Reports />)} />
            <Route path="users" element={staff('users.manage', <Users />)} />
            <Route path="activity" element={staff('logs.view', <Activity />)} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
