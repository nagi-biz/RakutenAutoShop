import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const articles = await getCollection('articles');
  return rss({
    title: '楽天お買い物ラボ',
    description: '楽天ランキングで話題の商品を毎日紹介します。',
    site: context.site,
    items: articles
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((article) => ({
        title: article.data.title,
        pubDate: article.data.pubDate,
        link: `/RakutenAutoShop/articles/${article.id}/`,
      })),
  });
}
