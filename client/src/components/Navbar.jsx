import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useShop } from '../context/ShopContext.jsx';
import NotificationBell from './NotificationBell.jsx';
import UserMenu from './UserMenu.jsx';

export default function Navbar() {
  const { user, loading, isCustomer, isStaff } = useAuth();
  const { cartCount } = useShop();

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          Game Shop
        </Link>
        <div className="nav-links">
          <NavLink to="/" end>
            Store
          </NavLink>
          {isCustomer && <NavLink to="/library">Library</NavLink>}
          {isCustomer && <NavLink to="/wishlist">Wishlist</NavLink>}
          {isCustomer && <NavLink to="/cart">Cart ({cartCount})</NavLink>}
          {isStaff && <NavLink to="/admin">Admin Panel</NavLink>}
        </div>
        <div className="nav-right">
          {user && <NotificationBell />}
          {!loading && user && <UserMenu />}
          {!loading && !user && (
            <>
              <Link to="/login" className="btn btn-sm btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
