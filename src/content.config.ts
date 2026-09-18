import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const cheatsheets = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cheatsheets' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['linux', 'services', 'containers', 'network', 'git', 'operations']),
    tags: z.array(z.string()).min(1),
    platforms: z.array(z.enum(['linux', 'windows', 'macos'])).min(1),
    testedWith: z.string().regex(
      /^.+ \d+(\.\d+)*\+?$/,
      'Формат: "Назва інструмента X.Y+" — наприклад "Docker CLI 28+" або "Git 2.43+"',
    ),
    risk: z.enum(['safe', 'changes-system', 'destructive']),
    updated: z.coerce.date(),
    order: z.number().int().positive(),
    featured: z.boolean().default(false),
    sources: z.array(z.object({
      label: z.string(),
      url: z.url(),
    })).min(1),
  }),
});

export const collections = { cheatsheets };
