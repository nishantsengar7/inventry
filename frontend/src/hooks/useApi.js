import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

export default function useApi(apiFunction, params = null, options = {}) {
  const { immediate = true, showError = true } = options;

  const [data, setData]         = useState(null);
  const [isLoading, setLoading] = useState(immediate);
  const [error, setError]       = useState(null);

  const fetch = useCallback(
    async (overrideParams) => {
      setLoading(true);
      setError(null);
      try {
        const arg = overrideParams !== undefined ? overrideParams : params;
        const result = await apiFunction(arg);
        setData(result);
        return result;
      } catch (err) {
        const message =
          err?.response?.data?.detail ||
          err?.message ||
          'Something went wrong';
        setError(message);
        if (showError) toast.error(message);
        return null;
      } finally {
        setLoading(false);
      }
    },

    [apiFunction, JSON.stringify(params)],
  );

  useEffect(() => {
    if (immediate) fetch();
  }, [fetch, immediate]);

  return { data, isLoading, error, refetch: fetch };
}
