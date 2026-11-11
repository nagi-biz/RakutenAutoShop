import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 商品ジャンル（楽天買い物ラボ カテゴリ構成案 2026-10-20、shop-strategy 山田 雄一 作成）の6分類。
// 記事は「楽天ランキングTOP5」形式で複数ジャンル混合のため、記事単位ではなく商品単位で持たせる。
export const CATEGORIES = ['beauty', 'food', 'daily', 'home', 'hobby', 'fashion'] as const;

// generate.mjs が src/content/articles/*.md に書き出すフロントマターのスキーマ。
// フィールドを変更する場合は generate.mjs 側のフロントマター生成部分も合わせて直すこと。
// 日本語版（articles）と英語版（articlesEn）で同一のスキーマを使う。
const articleSchema = z.object({
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
        // 商品ジャンル。lib/rakuten.mjs の classifyCategory() がキーワードから自動判定する。
        // キーワードに合致しない商品は未分類のまま（無理に推測しない）になり得るため optional。
        category: z.enum(CATEGORIES).optional(),
      }),
    )
    .min(1),
  // generate.mjs が直前の生成分との重複チェック（商品ID一致率・タイトル類似度）を
  // 行った結果。比較対象がない初回実行時などはフィールド自体が無い（省略可）。
  // 参照：reports/2026-10-21_楽天買い物ラボ_記事重複調査.md
  duplicateCheck: z
    .object({
      flagged: z.boolean(),
      itemCodeOverlapRatio: z.number(),
      titleSimilarity: z.number(),
      comparedTo: z.string(),
    })
    .optional(),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: articleSchema,
});

// 英語版記事。src/content/articles-en/ に日本語版と同じファイル名で置く。
// 日本語ファイルには手を入れず、翻訳はこのコレクション側だけで管理する
// （generate.mjs の再生成と干渉しないため）。
const articlesEn = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles-en' }),
  schema: articleSchema,
});

export const collections = { articles, articlesEn };
