import { useState, useCallback } from 'react';
import { clientAPI } from '../lib/clientApi';

export function useClientManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getClient = useCallback(async (clientId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await clientAPI.getClient(clientId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch client';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await clientAPI.getAllClients();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch clients';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getClient,
    getAllClients,
    loading,
    error,
    clearError: () => setError(null)
  };
}