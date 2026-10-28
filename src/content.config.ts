import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const cheatsheets = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cheatsheets' }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    category: z.enum(['linux', 'services', 'containers', 'network', 'git', 'operations', 'windows']),
    tags: z.array(z.string()).default([]),
    platforms: z.array(z.enum(['linux', 'windows', 'macos'])).min(1),
    testedWith: z.string().optional(),
    risk: z.enum(['safe', 'changes-system', 'destructive']).optional(),
    updated: z.coerce.date().optional(),
    order: z.number().int().positive().default(9999),
    featured: z.boolean().default(false),
    quickCmd: z.string().optional(),
    sources: z.array(z.object({
      label: z.string(),
      url: z.url(),
    })).default([]),
  }),
});

export const collections = { cheatsheets };
