import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client.js';

// A custom hook owns the state: data, error, loading (session 20)
export function useApi(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  // reload() changes this number, so the effect below runs again
  const [version, setVersion] = useState(0);

  // The state is only set when the answer arrives, never during the effect itself.
  // ignore: if the path changes before the answer, the old answer is dropped (session 15, cleanup)
  useEffect(() => {
    let ignore = false;
    apiFetch(path)
      .then(
        (result) => {
          if (ignore) return;
          setData(result);
          setError(null);
        },
        (err) => {
          if (!ignore) setError(err);
        }
      )
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [path, version]);

  // Called after a change (new review, accepted request...) to load the data again
  const reload = useCallback(() => {
    setLoading(true);
    setVersion((v) => v + 1);
  }, []);

  return { data, error, loading, reload };
}
