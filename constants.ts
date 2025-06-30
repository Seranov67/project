export const APP_CONFIG = {
  name: 'CheatSheet Hub',
  description: 'Повноцінний хаб шпаргалок для системних адміністраторів і програмістів',
  version: '1.0.0',
  author: 'CheatSheet Hub Team',
  repository: 'https://github.com/your-username/cheatsheet-hub'
};

export const DIFFICULTY_LEVELS = {
  beginner: {
    label: 'Початковий',
    color: 'green',
    description: 'Для новачків'
  },
  intermediate: {
    label: 'Середній',
    color: 'yellow',
    description: 'Для досвідчених користувачів'
  },
  advanced: {
    label: 'Просунутий',
    color: 'red',
    description: 'Для експертів'
  }
} as const;

export const SUPPORTED_LANGUAGES = [
  'bash',
  'javascript',
  'typescript',
  'python',
  'yaml',
  'json',
  'dockerfile',
  'sql',
  'css',
  'html',
  'markdown',
  'xml',
  'php',
  'java',
  'csharp',
  'cpp',
  'go',
  'rust',
  'ruby'
] as const;

export const CATEGORY_COLORS = {
  docker: '#2496ED',
  git: '#F05032',
  linux: '#FCC624',
  cloud: '#4285F4',
  programming: '#61DAFB'
} as const;

export const SEARCH_DEBOUNCE_DELAY = 300;
export const ITEMS_PER_PAGE = 12;
export const MAX_RECENT_SEARCHES = 5;

export const ROUTES = {
  home: '/',
  category: '/category/[id]',
  cheatsheet: '/cheatsheet/[id]',
  search: '/search',
  favorites: '/favorites',
  about: '/about'
} as const;

export const LOCAL_STORAGE_KEYS = {
  theme: 'cheatsheet-theme',
  favorites: 'cheatsheet-favorites',
  recentSearches: 'cheatsheet-recent-searches',
  preferences: 'cheatsheet-preferences'
} as const;