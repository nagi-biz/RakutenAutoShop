// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
// GitHub Pages（プロジェクトページ）にデプロイする前提の設定。
// リポジトリ名を変更した場合は base も合わせて変更すること。
// 独自ドメインを使う場合は site を独自ドメインに変え、base は削除する。
export default defineConfig({
  site: 'https://nagi-biz.github.io',
  base: '/RakutenAutoShop',
  integrations: [sitemap()],
  // 多言語化（Phase 1）: 日本語を既定とし、URLは従来通りプレフィックスなし。
  // 英語ページは /en/ 配下に手動で配置する。設計: docs/i18n-design.md
  i18n: {
    locales: ['ja', 'en'],
    defaultLocale: 'ja',
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
