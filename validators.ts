import { CheatSheet, Category, SearchFilters } from '@/types';

export const validateCheatSheet = (data: any): data is CheatSheet => {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.title === 'string' &&
    typeof data.description === 'string' &&
    typeof data.category === 'string' &&
    Array.isArray(data.tags) &&
    Array.isArray(data.content) &&
    typeof data.createdAt === 'string' &&
    typeof data.updatedAt === 'string' &&
    ['beginner', 'intermediate', 'advanced'].includes(data.difficulty)
  );
};

export const validateCategory = (data: any): data is Category => {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.description === 'string' &&
    typeof data.icon === 'string' &&
    typeof data.color === 'string' &&
    typeof data.count === 'number'
  );
};

export const validateSearchFilters = (data: any): data is SearchFilters => {
  return (
    typeof data === 'object' &&
    (data.category === undefined || typeof data.category === 'string') &&
    (data.tags === undefined || Array.isArray(data.tags)) &&
    (data.difficulty === undefined || typeof data.difficulty === 'string') &&
    (data.language === undefined || typeof data.language === 'string')
  );
};

export const sanitizeSearchQuery = (query: string): string => {
  return query
    .trim()
    .replace(/[<>]/g, '') // Видалити потенційно небезпечні символи
    .substring(0, 100); // Обмежити довжину
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};