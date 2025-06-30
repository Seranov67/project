import { useState, useEffect, useMemo } from 'react';
import { CheatSheet, Category, SearchFilters } from '@/types';
import { cheatSheetService } from '@/lib/data-utils';

// Хук для пошуку шпаргалок
export const useCheatSheetSearch = (initialQuery: string = '', initialFilters: SearchFilters = {}) => {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(false);

  const results = useMemo(() => {
    setIsLoading(true);
    const searchResults = cheatSheetService.searchCheatSheets(query, filters);
    setIsLoading(false);
    return searchResults;
  }, [query, filters]);

  const updateQuery = (newQuery: string) => {
    setQuery(newQuery);
  };

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return {
    query,
    filters,
    results,
    isLoading,
    updateQuery,
    updateFilters,
    clearFilters,
    totalResults: results.length
  };
};

// Хук для отримання шпаргалки за ID
export const useCheatSheet = (id: string) => {
  const [cheatSheet, setCheatSheet] = useState<CheatSheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      const sheet = cheatSheetService.getCheatSheetById(id);
      if (sheet) {
        setCheatSheet(sheet);
      } else {
        setError('Шпаргалка не знайдена');
      }
    } catch (err) {
      setError('Помилка завантаження шпаргалки');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const similarSheets = useMemo(() => {
    if (!cheatSheet) return [];
    return cheatSheetService.getSimilarCheatSheets(cheatSheet.id);
  }, [cheatSheet]);

  return {
    cheatSheet,
    similarSheets,
    isLoading,
    error
  };
};

// Хук для роботи з категоріями
export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // В реальному додатку тут може бути API запит
    const allCategories = cheatSheetService.getAllCheatSheets()
      .reduce((acc, sheet) => {
        const category = acc.find(cat => cat.id === sheet.category);
        if (category) {
          category.count++;
        }
        return acc;
      }, [...cheatSheetService.categories] as Category[]);

    setCategories(allCategories);
  }, []);

  return { categories };
};

// Хук для збережених шпаргалок (localStorage)
export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('cheatsheet-favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (error) {
        console.error('Помилка завантаження збережених шпаргалок:', error);
      }
    }
  }, []);

  const addToFavorites = (id: string) => {
    setFavorites(prev => {
      const updated = [...prev, id];
      localStorage.setItem('cheatsheet-favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromFavorites = (id: string) => {
    setFavorites(prev => {
      const updated = prev.filter(fav => fav !== id);
      localStorage.setItem('cheatsheet-favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      removeFromFavorites(id);
    } else {
      addToFavorites(id);
    }
  };

  const isFavorite = (id: string) => favorites.includes(id);

  const getFavoriteSheets = () => {
    return favorites
      .map(id => cheatSheetService.getCheatSheetById(id))
      .filter(Boolean) as CheatSheet[];
  };

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    getFavoriteSheets,
    favoritesCount: favorites.length
  };
};

// Хук для теми
export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('cheatsheet-theme');
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
    } else {
      // Визначити тему за системними налаштуваннями
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('cheatsheet-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme, isDark: theme === 'dark' };
};

// Хук для статистики
export const useStatistics = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const statistics = cheatSheetService.getStatistics();
    setStats(statistics);
  }, []);

  return { stats };
};