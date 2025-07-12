// Product search functionality hook
import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

export const useProductSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(term)}`);
      const data = await response.json();
      setSearchResults(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useMemo(
    () => debounce(performSearch, 300),
    [performSearch]
  );

  const search = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  const searchByBarcode = useCallback(async (barcode: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/barcode/${barcode}`);
      const data = await response.json();
      return data.product;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Barcode search failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
  }, []);

  return {
    searchTerm,
    searchResults,
    loading,
    error,
    search,
    searchByBarcode,
    clearSearch,
  };
};
