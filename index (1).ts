export interface CheatSheet {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  content: CheatSheetSection[];
  createdAt: string;
  updatedAt: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language?: string;
}

export interface CheatSheetSection {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  explanation?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
}

export interface SearchFilters {
  category?: string;
  tags?: string[];
  difficulty?: string;
  language?: string;
}

export interface SearchResult {
  cheatsheets: CheatSheet[];
  totalCount: number;
  categories: Category[];
}

export type Theme = 'light' | 'dark';

export interface AppState {
  theme: Theme;
  searchQuery: string;
  filters: SearchFilters;
  favorites: string[];
}