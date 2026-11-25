// 季節・イベント特集バナーと公式キャンペーンバナー枠の設定。
//
//
// イベントを切り替えるときは SEASONAL_EVENT の値だけを変更する（お正月など）。
// start / end は JST（+09:00）で指定し、期間内だけバナーが表示される
// （判定は SeasonalBanner.astro のクライアントサイドJS。期間外は自動で消える）。
// 使わない時期は SEASONAL_EVENT を null にする。
//
//
// CAMPAIGN_BANNER が null の間は何も表示されない。
// 公式発表済みのキャンペーンがあるときだけ、楽天アフィリエイトで作成した
// 公式バナーの画像URL・リンクURLをここに入れる（記入例は下のコメント参照）。
// 未確認のキャンペーン文言やダミー画像は入れないこと。

export interface SeasonalEvent {
id: string;
/** 'xmas' でクリスマステーマ（深緑×赤×ゴールド）。それ以外は既定テーマ */
theme: 'xmas' | 'plain';
/** 表示開始（JST・ISO 8601） */
start: string;
/** 表示終了（JST・ISO 8601） */
end: string;
label: { ja: string; en: string};
title: { ja: string; en: string};
meta: { ja: string; en: string};
button: { ja: string; en: string};
/** リンク先パス（base はコンポーネント側で付与） */
path: string;
}

export const SEASONAL_EVENT: SeasonalEvent | null = {
id: 'christmas-2026',
theme: 'xmas',
start: '2026-11-25T00:00:00+09:00',
end: '2026-12-25T23:59:59+09:00',
label: { ja: '🎄 CHRISTMAS 🎄', en: '🎄 CHRISTMAS 🎄'},
title: { ja: '🎄 クリスマスギフト特集', en: '🎄 Christmas Gift Picks'},
meta: {
ja: '贈り物に人気の商品を集めました。リンク集ページでまとめてチェックできます。',
en: 'A hand-picked collection of popular gift ideas — browse them all on our link page.',
},
button: { ja: 'リンク集でギフト候補を見る', en: 'See gift picks on the link page'},
path: '/tiktok/',
};

export interface CampaignBanner {
/** 楽天アフィリエイトで作成した公式バナーの画像URL */
image: string;
/** 公式バナーのリンクURL */
href: string;
alt: { ja: string; en: string};
/** 表示開始（JST・ISO 8601）。空文字なら開始制限なし */
start: string;
/** 表示終了（JST・ISO 8601）。空文字なら終了制限なし */
end: string;
}

// 記入例 — 楽天スーパーSALEが公式発表されたら、楽天アフィリエイトで作成した
// 公式バナーの画像URLとリンクURLを使って以下のように設定する:
// export const CAMPAIGN_BANNER: CampaignBanner | null = {
// image: 'https://... (公式バナーの画像URL)',
// href: 'https://... (公式バナーのリンクURL)',
// alt: { ja: '楽天スーパーSALE', en: 'Rakuten Super SALE'},
// start: '2026-12-04T20:00:00+09:00',
// end: '2026-12-11T01:59:00+09:00',
//};
export const CAMPAIGN_BANNER: CampaignBanner | null = null;
