// Приклади використання CheatSheet Hub API

import { cheatSheetService } from '@/lib/data-utils';
import { useCheatSheetSearch, useCheatSheet, useFavorites } from '@/lib/hooks';

// 1. Пошук шпаргалок
export const SearchExample = () => {
  const {
    query,
    filters,
    results,
    updateQuery,
    updateFilters,
    clearFilters
  } = useCheatSheetSearch();

  const handleSearch = (searchTerm: string) => {
    updateQuery(searchTerm);
  };

  const handleCategoryFilter = (category: string) => {
    updateFilters({ category });
  };

  return (
    <div>
      <input 
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Пошук шпаргалок..."
      />
      <div>Знайдено: {results.length} результатів</div>
    </div>
  );
};

// 2. Отримання конкретної шпаргалки
export const CheatSheetExample = ({ id }: { id: string }) => {
  const { cheatSheet, similarSheets, isLoading, error } = useCheatSheet(id);

  if (isLoading) return <div>Завантаження...</div>;
  if (error) return <div>Помилка: {error}</div>;
  if (!cheatSheet) return <div>Шпаргалка не знайдена</div>;

  return (
    <div>
      <h1>{cheatSheet.title}</h1>
      <p>{cheatSheet.description}</p>
      <div>Схожі шпаргалки: {similarSheets.length}</div>
    </div>
  );
};

// 3. Робота з обраними
export const FavoritesExample = () => {
  const { 
    favorites, 
    toggleFavorite, 
    isFavorite, 
    getFavoriteSheets 
  } = useFavorites();

  const favoriteSheets = getFavoriteSheets();

  return (
    <div>
      <h2>Обрані шпаргалки ({favorites.length})</h2>
      {favoriteSheets.map(sheet => (
        <div key={sheet.id}>
          <h3>{sheet.title}</h3>
          <button onClick={() => toggleFavorite(sheet.id)}>
            {isFavorite(sheet.id) ? 'Видалити з обраних' : 'Додати до обраних'}
          </button>
        </div>
      ))}
    </div>
  );
};

// 4. Використання сервісу напряму
export const DirectServiceExample = () => {
  // Отримати всі шпаргалки
  const allSheets = cheatSheetService.getAllCheatSheets();

  // Пошук з фільтрами
  const dockerSheets = cheatSheetService.searchCheatSheets('', {
    category: 'docker',
    difficulty: 'beginner'
  });

  // Отримати статистику
  const stats = cheatSheetService.getStatistics();

  // Популярні теги
  const popularTags = cheatSheetService.getPopularTags(5);

  return (
    <div>
      <p>Всього шпаргалок: {allSheets.length}</p>
      <p>Docker шпаргалок для початківців: {dockerSheets.length}</p>
      <p>Популярні теги: {popularTags.join(', ')}</p>
    </div>
  );
};

// 5. Приклад компонента з повним функціоналом
export const FullFeaturedExample = () => {
  const { results, updateQuery, updateFilters } = useCheatSheetSearch();
  const { toggleFavorite, isFavorite } = useFavorites();

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Пошук шпаргалок..."
        onChange={(e) => updateQuery(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <div className="flex gap-2">
        <button onClick={() => updateFilters({ difficulty: 'beginner' })}>
          Початковий
        </button>
        <button onClick={() => updateFilters({ difficulty: 'intermediate' })}>
          Середній
        </button>
        <button onClick={() => updateFilters({ difficulty: 'advanced' })}>
          Просунутий
        </button>
      </div>

      <div className="grid gap-4">
        {results.map(sheet => (
          <div key={sheet.id} className="p-4 border rounded">
            <h3 className="font-bold">{sheet.title}</h3>
            <p className="text-gray-600">{sheet.description}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm bg-blue-100 px-2 py-1 rounded">
                {sheet.category}
              </span>
              <button
                onClick={() => toggleFavorite(sheet.id)}
                className={`px-3 py-1 rounded ${
                  isFavorite(sheet.id) 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-200'
                }`}
              >
                {isFavorite(sheet.id) ? '❤️' : '🤍'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};