export const categories = [
  { slug: 'linux', label: 'Linux', mark: '$', description: 'Файли, права, процеси та диски' },
  { slug: 'services', label: 'Services', mark: '●', description: 'systemd, журнали та служби' },
  { slug: 'containers', label: 'Containers', mark: '⬡', description: 'Docker lifecycle і діагностика' },
  { slug: 'network', label: 'Network', mark: '↗', description: 'SSH, HTTP та мережеві перевірки' },
  { slug: 'git', label: 'Git', mark: '⑂', description: 'Щоденна робота й безпечне відновлення' },
  { slug: 'operations', label: 'Operations', mark: '⌁', description: 'Спостережуваність і периферія' },
  { slug: 'windows', label: 'Windows', mark: '⊞', description: 'GPO, RDP, інсталяція та відновлення' },
] as const;

export type CategorySlug = (typeof categories)[number]['slug'];

export const riskLabels = {
  safe: 'Безпечно',
  'changes-system': 'Змінює систему',
  destructive: 'Незворотно',
} as const;

export const platformLabels = {
  linux: 'Linux',
  windows: 'Windows',
  macos: 'macOS',
} as const;

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
