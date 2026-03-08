import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function TopNav() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="topnav">
      <NavLink to="/" className="topnav__brand">
        🍺 BeerTracker
      </NavLink>

      <div className="topnav__links">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            'topnav__link' + (isActive ? ' active' : '')
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/beers"
          className={({ isActive }) =>
            'topnav__link' + (isActive ? ' active' : '')
          }
        >
          Beers
        </NavLink>
        <NavLink
          to="/me"
          className={({ isActive }) =>
            'topnav__link' + (isActive ? ' active' : '')
          }
        >
          My Stats
        </NavLink>
      </div>

      {session && (
        <button className="topnav__logout" onClick={handleLogout}>
          {session.email.split('@')[0]} · Logout
        </button>
      )}
    </nav>
  );
}
