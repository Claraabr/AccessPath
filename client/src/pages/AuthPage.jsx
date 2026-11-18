import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';

// Login and signup on one page, like the LoginPage of session 20
export function AuthPage({ onDone }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      if (mode === 'login') {
        await login(form.get('email'), form.get('password'));
      } else {
        await signup(form.get('name'), form.get('email'), form.get('password'), form.get('role'));
      }
      onDone();
    } catch (err) {
      setError(err.message);
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
  }

  return (
    <div className="auth card">
      <h1>{mode === 'login' ? 'Log in' : 'Create an account'}</h1>
      <p className="muted">Check if a place in Lebanon is accessible before you go.</p>
      <form onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <label>
            Name
            <input name="name" required maxLength={80} />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" required minLength={mode === 'signup' ? 8 : undefined} />
        </label>
        {mode === 'signup' && (
          <fieldset>
            <legend>I am…</legend>
            <label className="check">
              <input type="radio" name="role" value="user" defaultChecked />
              Looking for accessible places or equipment
            </label>
            <label className="check">
              <input type="radio" name="role" value="venue" />
              A place (cafe, hotel, shop, pharmacy…) that shows its accessibility
            </label>
            <label className="check">
              <input type="radio" name="role" value="supplier" />
              An equipment supplier (I rent or sell ramps, wheelchairs…)
            </label>
          </fieldset>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <button>{mode === 'login' ? 'Log in' : 'Sign up'}</button>
      </form>
      <p className="muted" style={{ marginTop: 16 }}>
        {mode === 'login' ? 'No account yet? ' : 'Already have an account? '}
        <button className="link" onClick={switchMode}>
          {mode === 'login' ? 'Sign up' : 'Log in'}
        </button>
      </p>
    </div>
  );
}
