import { useAuth } from '../auth/AuthContext.jsx';

// Each role has its own menu:
// user     -> Places, AccessFix, My requests
// venue    -> My place, AccessFix, My requests
// supplier -> My listings, Requests received
// Before login, only the name of the app is shown
export function Header({ page, go }) {
  const { token, user, logout } = useAuth();

  // One menu button; aria-current tells screen readers which page is open
  function link(name, label) {
    return (
      <button aria-current={page.name === name ? 'page' : undefined} onClick={() => go(name)}>
        {label}
      </button>
    );
  }

  return (
    <header className="header">
      <span className="brand">AccessPath</span>
      {token && user && (
        <nav className="nav" aria-label="Main menu">
          {user.role === 'user' && link('places', 'Places')}
          {user.role === 'venue' && link('my-places', 'My place')}
          {user.role === 'supplier' && link('my-listings', 'My listings')}
          {user.role !== 'supplier' && link('listings', 'AccessFix')}
          {user.role !== 'supplier' && link('my-requests', 'My requests')}
          {user.role === 'supplier' && link('received', 'Requests received')}
          <button
            className="logout"
            onClick={() => {
              logout();
              go('places');
            }}
          >
            Log out ({user.name})
          </button>
        </nav>
      )}
    </header>
  );
}
