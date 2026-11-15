import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import { Header } from './components/Header.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { PlacesPage } from './pages/PlacesPage.jsx';
import { PlacePage } from './pages/PlacePage.jsx';
import { MyPlacePage } from './pages/MyPlacePage.jsx';
import { ListingsPage } from './pages/ListingsPage.jsx';
import { ListingPage } from './pages/ListingPage.jsx';
import { MyListingsPage } from './pages/MyListingsPage.jsx';
import { MyRequestsPage } from './pages/MyRequestsPage.jsx';
import { ReceivedPage } from './pages/ReceivedPage.jsx';

// Each page has its own URL, so a refresh or the back button keeps you on it.
// "/" is the home page of each role: the search for a user,
// its own place for a venue, my listings for a supplier.
const PATHS = {
  places: () => '/',
  'my-places': () => '/',
  'my-listings': () => '/',
  place: (id) => `/places/${id}`,
  listings: () => '/accessfix',
  listing: (id) => `/accessfix/${id}`,
  'my-requests': () => '/my-requests',
  received: () => '/received',
};

const HOME = { user: 'places', venue: 'my-places', supplier: 'my-listings' };

// Which menu entry is open, for the Header
function pageName(pathname, role) {
  if (pathname === '/') return HOME[role];
  if (pathname.startsWith('/places/')) return 'place';
  if (pathname === '/accessfix') return 'listings';
  if (pathname.startsWith('/accessfix/')) return 'listing';
  return pathname.slice(1);
}

// The id comes from the URL (/places/:id)
function PlaceRoute({ go }) {
  const { id } = useParams();
  return <PlacePage id={id} go={go} />;
}

function ListingRoute({ go }) {
  const { id } = useParams();
  return <ListingPage id={id} go={go} />;
}

export default function App() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const page = { name: pageName(pathname, user?.role) };

  function go(name, id) {
    navigate(PATHS[name] ? PATHS[name](id) : '/');
    window.scrollTo(0, 0);
  }

  // No token -> only the login / signup screen (session 20: App gates on the token)
  if (!token) {
    return (
      <>
        <Header page={page} go={go} />
        <main className="main">
          <AuthPage onDone={() => go('places')} />
        </main>
      </>
    );
  }

  // After a refresh we only have the token: wait for /api/auth/me to know the role
  if (!user) {
    return (
      <>
        <Header page={page} go={go} />
        <main className="main"><p>Loading…</p></main>
      </>
    );
  }

  // Each role only gets its own pages; any other URL goes back to its home page
  let routes;
  if (user.role === 'venue') {
    routes = (
      <>
        <Route path="/" element={<MyPlacePage go={go} />} />
        <Route path="/accessfix" element={<ListingsPage go={go} />} />
        <Route path="/accessfix/:id" element={<ListingRoute go={go} />} />
        <Route path="/my-requests" element={<MyRequestsPage go={go} />} />
        <Route path="*" element={<MyPlacePage go={go} />} />
      </>
    );
  } else if (user.role === 'supplier') {
    routes = (
      <>
        <Route path="/" element={<MyListingsPage />} />
        <Route path="/received" element={<ReceivedPage />} />
        <Route path="*" element={<MyListingsPage />} />
      </>
    );
  } else {
    routes = (
      <>
        <Route path="/" element={<PlacesPage go={go} />} />
        <Route path="/places/:id" element={<PlaceRoute go={go} />} />
        <Route path="/accessfix" element={<ListingsPage go={go} />} />
        <Route path="/accessfix/:id" element={<ListingRoute go={go} />} />
        <Route path="/my-requests" element={<MyRequestsPage go={go} />} />
        <Route path="*" element={<PlacesPage go={go} />} />
      </>
    );
  }

  return (
    <>
      <Header page={page} go={go} />
      <main className="main">
        <Routes>{routes}</Routes>
      </main>
    </>
  );
}
