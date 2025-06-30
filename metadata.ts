// Метадані проекту CheatSheet Hub

export const PROJECT_METADATA = {
  // Основна інформація
  title: 'CheatSheet Hub',
  description: 'Повноцінний хаб шпаргалок для системних адміністраторів і програмістів',
  keywords: [
    'cheatsheet', 'шпаргалки', 'docker', 'git', 'linux', 'cloud', 'programming',
    'devops', 'sysadmin', 'development', 'commands', 'reference'
  ],

  // SEO метадані
  seo: {
    title: 'CheatSheet Hub - Шпаргалки для розробників та системних адміністраторів',
    description: 'Колекція корисних шпаргалок з Docker, Git, Linux, хмарних технологій та програмування. Швидкий доступ до команд та прикладів коду.',
    ogTitle: 'CheatSheet Hub - Ваш надійний помічник у розробці',
    ogDescription: 'Знайдіть потрібні команди та приклади коду за лічені секунди',
    ogImage: '/images/og-image.png',
    twitterCard: 'summary_large_image'
  },

  // Статистика контенту
  contentStats: {
    totalCategories: 5,
    totalCheatSheets: 8,
    totalSections: 15,
    totalTags: 25,
    lastUpdated: new Date().toISOString()
  },

  // Функції та можливості
  features: [
    'Потужний пошук по назві та тегах',
    'Організація по категоріях',
    'Підсвічування синтаксису коду',
    'Адаптивний дизайн',
    'Темна/світла тема',
    'Копіювання коду в буфер обміну',
    'Збереження обраних шпаргалок',
    'Експорт даних у різних форматах'
  ],

  // Технічні деталі
  technical: {
    framework: 'Next.js 14',
    language: 'TypeScript',
    styling: 'Tailwind CSS',
    deployment: 'Vercel',
    repository: 'https://github.com/your-username/cheatsheet-hub'
  },

  // Версія та історія змін
  version: {
    current: '1.0.0',
    releaseDate: '2024-01-01',
    changelog: [
      {
        version: '1.0.0',
        date: '2024-01-01',
        changes: [
          'Початковий реліз',
          'Базова функціональність пошуку',
          'Підтримка 5 категорій',
          'Темна/світла тема'
        ]
      }
    ]
  }
};

// Функції для роботи з метаданими
export const getProjectInfo = () => PROJECT_METADATA;
export const getContentStats = () => PROJECT_METADATA.contentStats;
export const getSEOData = (page?: string) => {
  const baseSEO = PROJECT_METADATA.seo;
  if (page) {
    return {
      ...baseSEO,
      title: `${page} - ${baseSEO.title}`,
      ogTitle: `${page} - ${baseSEO.ogTitle}`
    };
  }
  return baseSEO;
};

export default PROJECT_METADATA;