import type { CollectionEntry } from 'astro:content';

/**
 * 商品ジャンル（カテゴリ）の定義と、全記事からジャンル別に商品を集めるヘルパー。
 * カテゴリの値は src/content.config.ts の CATEGORIES（商品単位で付与）と対応する。
 */
export const GENRE_KEYS = [
  'food',
  'beauty',
  'daily',
  'home',
  'hobby',
  'fashion',
] as const;

export type GenreKey = (typeof GENRE_KEYS)[number];

export interface GenreMeta {
  key: GenreKey;
  /** 日本語名 */
  ja: string;
  /** 英語名 */
  en: string;
  /** アイコン絵文字 */
  icon: string;
}

export const GENRES: GenreMeta[] = [
  { key: 'food', ja: '食品・グルメ', en: 'Food & Gourmet', icon: '🍜' },
  { key: 'beauty', ja: '美容・コスメ', en: 'Beauty', icon: '💄' },
  { key: 'daily', ja: '日用品・生活雑貨', en: 'Daily Goods', icon: '🧺' },
  { key: 'home', ja: 'インテリア・家電', en: 'Home & Interior', icon: '🏠' },
  { key: 'hobby', ja: 'ホビー・グッズ', en: 'Hobby & Collectibles', icon: '🎁' },
  { key: 'fashion', ja: 'ファッション', en: 'Fashion', icon: '👕' },
];

export const genreMeta = (key: string): GenreMeta | undefined =>
  GENRES.find((g) => g.key === key);

export interface GenreProduct {
  itemCode: string;
  name: string;
  /** 表示用に _ex=400x400 へ置換済みの画像URL */
  imageUrl: string;
  price: number;
  shopName: string;
  affiliateUrl: string;
  category: GenreKey;
  /** その商品が載っている最新記事の公開日 */
  pubDate: Date;
}

type ArticleEntry = CollectionEntry<'articles'>;

/**
 * 全記事の商品をジャンル別に集める。
 * - itemCode で重複排除し、重複時は最新の記事（pubDate が新しい方）の商品情報を優先する。
 * - 各ジャンル内は新しい記事の順に並ぶ。
 * - カテゴリ未設定の商品は対象外。
 * - 商品画像はサムネイル用パラメータを _ex=400x400 に置換して返す。
 */
export function collectProductsByGenre(
  articles: ArticleEntry[],
): Map<GenreKey, GenreProduct[]> {
  const sorted = [...articles].sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
  const seen = new Set<string>();
  const byGenre = new Map<GenreKey, GenreProduct[]>(
    GENRE_KEYS.map((key) => [key, [] as GenreProduct[]]),
  );
  for (const article of sorted) {
    for (const product of article.data.products) {
      if (!product.category) continue;
      if (seen.has(product.itemCode)) continue;
      seen.add(product.itemCode);
      byGenre.get(product.category)?.push({
        itemCode: product.itemCode,
        name: product.name,
        imageUrl: product.imageUrl.replace(/_ex=\d+x\d+/, '_ex=400x400'),
        price: product.price,
        shopName: product.shopName,
        affiliateUrl: product.affiliateUrl,
        category: product.category,
        pubDate: article.data.pubDate,
      });
    }
  }
  return byGenre;
}

/** ジャンル別の商品件数（重複排除後）だけを返す軽量版。 */
export function genreCounts(
  articles: ArticleEntry[],
): Map<GenreKey, number> {
  const byGenre = collectProductsByGenre(articles);
  return new Map(GENRE_KEYS.map((key) => [key, byGenre.get(key)?.length ?? 0]));
}

/** 価格を「¥1,234」形式に整形する。 */
export const formatYen = (price: number, lang: 'ja' | 'en' = 'ja'): string =>
  `¥${price.toLocaleString(lang === 'en' ? 'en-US' : 'ja-JP')}`;
