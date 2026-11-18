import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';

// Each role has its own menu:
// user     -> Places, AccessFix, My requests
// venue    -> My place, AccessFix, My requests
// supplier -> My listings, Requests received
// Before login, only the name of the app is shown, in a band at the top.
// After login, the menu is a column on the left (a top bar with a Menu button on phones).

// Line icons on a 24x24 grid, like the accessibility icons of the app
const ICONS = {
  places: <path d="M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM15.5 15.5 21 21" />, // magnifier
  'my-places': <path d="M4 9 5.5 4h13L20 9M4 9h16M5 9v11h14V9M10 20v-5h4v5" />, // shop front
  listings: <path d="M3 19h18V7z" />, // a ramp, like the step-free icon
  'my-requests': <path d="M4 6h16v12H4zM4 7l8 6 8-6" />, // envelope
  'my-listings': <path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10" />, // box
  received: <path d="M4 13 7 5h10l3 8v6H4zM4 13h5l1 2h4l1-2h5" />, // inbox tray
};

const ROLE_NAMES = { user: 'Visitor', venue: 'Place owner', supplier: 'Equipment supplier' };

export function Header({ page, go }) {
  const { token, user, logout } = useAuth();
  // Phones only: is the menu unfolded?
  const [open, setOpen] = useState(false);

  if (!token || !user) {
    return (
      <header className="header">
        <span className="brand">AccessPath</span>
      </header>
    );
  }

  // One menu entry; aria-current tells screen readers which page is open
  function link(name, label) {
    return (
      <button
        aria-current={page.name === name ? 'page' : undefined}
        onClick={() => {
          go(name);
          setOpen(false);
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {ICONS[name]}
        </svg>
        {label}
      </button>
    );
  }

  return (
    <header className="sidebar">
      <span className="brand">AccessPath</span>
      <button className="menu-toggle" aria-expanded={open} aria-controls="side-menu" onClick={() => setOpen(!open)}>
        {open ? 'Close' : 'Menu'}
      </button>
      <div id="side-menu" className={open ? 'side-menu open' : 'side-menu'}>
        <nav className="side-nav" aria-label="Main menu">
          {user.role === 'user' && link('places', 'Places')}
          {user.role === 'venue' && link('my-places', 'My place')}
          {user.role === 'supplier' && link('my-listings', 'My listings')}
          {user.role !== 'supplier' && link('listings', 'AccessFix')}
          {user.role !== 'supplier' && link('my-requests', 'My requests')}
          {user.role === 'supplier' && link('received', 'Requests received')}
        </nav>
        <div className="side-user">
          <p>
            <strong>{user.name}</strong>
            <span>{ROLE_NAMES[user.role]}</span>
          </p>
          <button
            className="logout"
            onClick={() => {
              logout();
              setOpen(false);
              go('places');
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
