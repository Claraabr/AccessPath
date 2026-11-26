import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client.js';

// A custom hook owns the state: data, error, loading (session 20)
export function useApi(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  // reload() changes this number, so the effect below runs again
  const [version, setVersion] = useState(0);
  // Which request the data on screen belongs to. While it is not the current one, we are loading:
  // a new path (a new search) or a reload shows "loading" again without setting state in the effect.
  const key = `${path}#${version}`;
  const [doneKey, setDoneKey] = useState(null);
  const loading = doneKey !== key;

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
        if (!ignore) setDoneKey(key);
      });
    return () => {
      ignore = true;
    };
  }, [path, key]);

  // Called after a change (new review, accepted request...) to load the data again
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { data, error, loading, reload };
}
