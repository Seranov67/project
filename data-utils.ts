import { CheatSheet, Category, SearchFilters } from '@/types';
import { categories, cheatsheets, tags } from './index';

export class CheatSheetService {
  private static instance: CheatSheetService;
  private cheatsheets: CheatSheet[] = cheatsheets;
  private categories: Category[] = categories;

  static getInstance(): CheatSheetService {
    if (!CheatSheetService.instance) {
      CheatSheetService.instance = new CheatSheetService();
    }
    return CheatSheetService.instance;
  }

  // Отримати всі шпаргалки
  getAllCheatSheets(): CheatSheet[] {
    return this.cheatsheets;
  }

  // Отримати шпаргалку за ID
  getCheatSheetById(id: string): CheatSheet | undefined {
    return this.cheatsheets.find(sheet => sheet.id === id);
  }

  // Отримати шпаргалки за категорією
  getCheatSheetsByCategory(categoryId: string): CheatSheet[] {
    return this.cheatsheets.filter(sheet => sheet.category === categoryId);
  }

  // Пошук шпаргалок
  searchCheatSheets(query: string, filters?: SearchFilters): CheatSheet[] {
    let results = this.cheatsheets;

    // Фільтрація за категорією
    if (filters?.category) {
      results = results.filter(sheet => sheet.category === filters.category);
    }

    // Фільтрація за складністю
    if (filters?.difficulty) {
      results = results.filter(sheet => sheet.difficulty === filters.difficulty);
    }

    // Фільтрація за мовою програмування
    if (filters?.language) {
      results = results.filter(sheet => 
        sheet.language?.toLowerCase() === filters.language?.toLowerCase()
      );
    }

    // Фільтрація за тегами
    if (filters?.tags && filters.tags.length > 0) {
      results = results.filter(sheet =>
        filters.tags!.some(tag => sheet.tags.includes(tag))
      );
    }

    // Текстовий пошук
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      results = results.filter(sheet =>
        sheet.title.toLowerCase().includes(searchTerm) ||
        sheet.description.toLowerCase().includes(searchTerm) ||
        sheet.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        sheet.content.some(section =>
          section.title.toLowerCase().includes(searchTerm) ||
          section.code.toLowerCase().includes(searchTerm) ||
          (section.explanation && section.explanation.toLowerCase().includes(searchTerm))
        )
      );
    }

    return results;
  }

  // Отримати популярні теги
  getPopularTags(limit: number = 10): string[] {
    const tagCounts = new Map<string, number>();

    this.cheatsheets.forEach(sheet => {
      sheet.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag);
  }

  // Отримати схожі шпаргалки
  getSimilarCheatSheets(cheatSheetId: string, limit: number = 5): CheatSheet[] {
    const currentSheet = this.getCheatSheetById(cheatSheetId);
    if (!currentSheet) return [];

    const similar = this.cheatsheets
      .filter(sheet => sheet.id !== cheatSheetId)
      .map(sheet => ({
        sheet,
        similarity: this.calculateSimilarity(currentSheet, sheet)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.sheet);

    return similar;
  }

  // Розрахувати схожість між шпаргалками
  private calculateSimilarity(sheet1: CheatSheet, sheet2: CheatSheet): number {
    let score = 0;

    // Схожість за категорією
    if (sheet1.category === sheet2.category) score += 3;

    // Схожість за тегами
    const commonTags = sheet1.tags.filter(tag => sheet2.tags.includes(tag));
    score += commonTags.length * 2;

    // Схожість за складністю
    if (sheet1.difficulty === sheet2.difficulty) score += 1;

    // Схожість за мовою програмування
    if (sheet1.language && sheet2.language && sheet1.language === sheet2.language) {
      score += 2;
    }

    return score;
  }

  // Отримати статистику
  getStatistics() {
    const totalSheets = this.cheatsheets.length;
    const categoryCounts = new Map<string, number>();
    const difficultyCounts = new Map<string, number>();
    const languageCounts = new Map<string, number>();

    this.cheatsheets.forEach(sheet => {
      // Підрахунок за категоріями
      categoryCounts.set(sheet.category, (categoryCounts.get(sheet.category) || 0) + 1);

      // Підрахунок за складністю
      difficultyCounts.set(sheet.difficulty, (difficultyCounts.get(sheet.difficulty) || 0) + 1);

      // Підрахунок за мовами
      if (sheet.language) {
        languageCounts.set(sheet.language, (languageCounts.get(sheet.language) || 0) + 1);
      }
    });

    return {
      totalSheets,
      totalCategories: this.categories.length,
      categoryCounts: Object.fromEntries(categoryCounts),
      difficultyCounts: Object.fromEntries(difficultyCounts),
      languageCounts: Object.fromEntries(languageCounts),
      popularTags: this.getPopularTags()
    };
  }
}

// Утилітарні функції
export const formatCheatSheetDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('uk-UA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'beginner':
      return 'text-green-600 bg-green-100';
    case 'intermediate':
      return 'text-yellow-600 bg-yellow-100';
    case 'advanced':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getCategoryIcon = (categoryId: string): string => {
  const category = categories.find(cat => cat.id === categoryId);
  return category?.icon || 'file-text';
};

export const highlightCode = (code: string, language: string): string => {
  // Базове підсвічування для демонстрації
  // В реальному проекті тут буде використовуватися Prism.js
  return code;
};

// Експорт сервісу як singleton
export const cheatSheetService = CheatSheetService.getInstance();