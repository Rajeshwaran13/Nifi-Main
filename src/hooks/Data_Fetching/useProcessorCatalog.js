import { useEffect, useState } from 'react';
import { fetchProcessorCatalog } from '../../services/processorCatalogService';
import { normalizeProcessorCatalog } from './processorMapper';

export const useProcessorCatalog = () => {
  const [processors, setProcessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const payload = await fetchProcessorCatalog();
        if (!active) return;
        setProcessors(normalizeProcessorCatalog(payload));
      } catch (err) {
        if (!active) return;
        setProcessors([]);
        setError(err?.message || 'Failed to load processor catalog');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return { processors, loading, error };
};
