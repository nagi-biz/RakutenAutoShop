import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// generate.mjs が src/content/articles/*.md に書き出すフロントマターのスキーマ。
// フィールドを変更する場合は generate.mjs 側のフロントマター生成部分も合わせて直すこと。
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    imageKeyword: z.string().optional(),
    products: z
      .array(
        z.object({
          rank: z.number(),
          itemCode: z.string(),
          name: z.string(),
          imageUrl: z.string(),
          price: z.number(),
          shopName: z.string(),
          affiliateUrl: z.string(),
        }),
      )
      .min(1),
  }),
});

export const collections = { articles };
