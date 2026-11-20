import { useAuth } from '../auth/AuthContext.jsx';

// "Welcome back" in the middle of the page, then the home page of the role below it
export function WelcomePage({ children }) {
  const { user } = useAuth();
  return (
    <>
      <p className="welcome">Welcome back, {user.name}</p>
      {children}
    </>
  );
}
