import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function TopNav() {
  const { session, displayName } = useAuth();

  return (
    <nav className="topnav">
      <NavLink to="/" className="topnav__brand">
        🍺 BeerTracker
      </NavLink>

      <div className="topnav__links">
        <NavLink
          to="/"
          end
          className={({ isActive }) => 'topnav__link' + (isActive ? ' active' : '')}
        >
          Home
        </NavLink>
        <NavLink
          to="/beers"
          className={({ isActive }) => 'topnav__link' + (isActive ? ' active' : '')}
        >
          Beers
        </NavLink>
        <NavLink
          to="/stats"
          className={({ isActive }) => 'topnav__link' + (isActive ? ' active' : '')}
        >
          Stats
        </NavLink>
        <NavLink
          to="/requests"
          className={({ isActive }) => 'topnav__link' + (isActive ? ' active' : '')}
        >
          Requests
        </NavLink>
      </div>

      {session && (
        <NavLink
          to="/settings"
          className={({ isActive }) => 'topnav__logout' + (isActive ? ' active' : '')}
        >
          {displayName}
        </NavLink>
      )}
    </nav>
  );
}
