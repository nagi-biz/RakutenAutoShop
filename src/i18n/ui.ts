// UI文言の辞書。多言語化の設計は docs/i18n-design.md を参照。
// 新しい言語を足すときは、ここにロケールを追加し、対応するページを作る。

export const locales = ['ja', 'en'] as const;
export type Lang = (typeof locales)[number];
export const defaultLang: Lang = 'ja';

const ja = {
  siteName: '楽天お買い物ラボ',
  defaultDescription: '楽天ランキングで話題の商品を毎日紹介します。',
  navNew: '新着ランキング',
  navPopular: '人気ランキング',
  navGuide: '買い方ガイド',
  disclosure:
    '本サイトの商品リンクには楽天アフィリエイトプログラムによるアフィリエイトリンクが含まれます。',
  footerAbout: '運営者情報',
  footerPrivacy: 'プライバシーポリシー',
  footerContact: 'お問い合わせ',
  // トップページ
  homeTitle: '楽天お買い物ラボ — 今売れているものまとめ',
  homeHeading: '今売れているものまとめ',
  homeIntro: '楽天ランキングをもとに、話題の商品を毎日ピックアップして紹介しています。',
  homeEmpty: 'まだ記事がありません。',
  // 記事ページ
  productsHeading: '紹介した商品',
  viewOnRakuten: '楽天市場で見る',
  dateLocale: 'ja-JP',
  // 言語スイッチャー（相手言語の名称で表示する）
  switcherLabel: 'English',
};

export type UIDict = typeof ja;

const en: UIDict = {
  siteName: 'Rakuten Shopping Lab',
  defaultDescription: 'Daily picks of trending products from the Rakuten rankings.',
  navNew: 'New Ranking',
  navPopular: 'Popular Ranking',
  navGuide: 'How to Buy',
  disclosure:
    'Product links on this site include affiliate links from the Rakuten Affiliate Program.',
  footerAbout: 'About',
  footerPrivacy: 'Privacy Policy',
  footerContact: 'Contact',
  // Home
  homeTitle: "Rakuten Shopping Lab — What's Selling Now",
  homeHeading: "What's Selling Now",
  homeIntro:
    'Every day we pick out trending products from the Rakuten Ichiba rankings and introduce them here.',
  homeEmpty: 'No articles yet.',
  // Article pages
  productsHeading: 'Products in this article',
  viewOnRakuten: 'View on Rakuten',
  dateLocale: 'en-US',
  switcherLabel: '日本語',
};

export const ui: Record<Lang, UIDict> = { ja, en };

export function getUI(lang: Lang): UIDict {
  return ui[lang] ?? ui[defaultLang];
}

/** 他言語ロケール（現在は2言語前提。増えたら最初の非自言語を返す） */
export function otherLang(lang: Lang): Lang {
  return lang === 'ja' ? 'en' : 'ja';
}
