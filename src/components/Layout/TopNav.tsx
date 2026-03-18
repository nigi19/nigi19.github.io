import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function TopNav() {
  const { session, displayName } = useAuth();
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Close on outside tap/click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const close = () => setOpen(false);

  return (
    <nav ref={navRef} className={`topnav${open ? ' topnav--open' : ''}`}>
      <NavLink to="/" className="topnav__brand" onClick={close}>
        🍺 BeerTracker
      </NavLink>

      <div className="topnav__links">
        <NavLink to="/" end className={({ isActive }) => 'topnav__link' + (isActive ? ' active' : '')} onClick={close}>
          Home
        </NavLink>
        <NavLink to="/beers" className={({ isActive }) => 'topnav__link' + (isActive ? ' active' : '')} onClick={close}>
          Beers
        </NavLink>
        <NavLink to="/stats" className={({ isActive }) => 'topnav__link' + (isActive ? ' active' : '')} onClick={close}>
          Stats
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => 'topnav__link' + (isActive ? ' active' : '')} onClick={close}>
          Dashboard
        </NavLink>
        <NavLink to="/requests" className={({ isActive }) => 'topnav__link' + (isActive ? ' active' : '')} onClick={close}>
          Requests
        </NavLink>
        {session && (
          <NavLink to="/settings" className={({ isActive }) => 'topnav__link topnav__link--user' + (isActive ? ' active' : '')} onClick={close}>
            {displayName}
          </NavLink>
        )}
      </div>

      {session && (
        <NavLink
          to="/settings"
          className={({ isActive }) => 'topnav__logout' + (isActive ? ' active' : '')}
          onClick={close}
        >
          {displayName}
        </NavLink>
      )}

      <button
        className="topnav__hamburger"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle menu"
        aria-expanded={open}
      >
        <span /><span /><span />
      </button>
    </nav>
  );
}
