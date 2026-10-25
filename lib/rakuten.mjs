// 2026年の楽天ウェブサービス基盤刷新に伴う新エンドポイント（旧: app.rakuten.co.jp/services/api/...）。
// 新方式では applicationId に加えて accessKey が必須になり、さらに「Web Application」タイプで
// 登録したアプリの場合は Referer/Origin ヘッダーが登録済みドメインと一致しないと
// 403 REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING で拒否される。
const RANKING_ENDPOINT =
  'https://openapi.rakuten.co.jp/ichibaranking/api/IchibaItem/Ranking/20220601';

// --mock 時に使うダミーのランキングデータ。
// 楽天APIの実レスポンス（Results[].item）の形をなるべく忠実に再現している。
export function mockRankingItems() {
  return [
    {
      itemCode: 'mock:0000001',
      itemName: '【mock】コードレス布団クリーナー',
      itemPrice: 12800,
      itemUrl: 'https://item.rakuten.co.jp/mock/0000001/',
      affiliateUrl: 'https://hb.afl.rakuten.co.jp/hgc/mock/0000001/',
      shopName: 'mockショップ',
      mediumImageUrls: [{ imageUrl: 'https://picsum.photos/seed/mock1/300/300' }],
    },
    {
      itemCode: 'mock:0000002',
      itemName: '【mock】electrolyzed 加湿空気清浄機',
      itemPrice: 24800,
      itemUrl: 'https://item.rakuten.co.jp/mock/0000002/',
      affiliateUrl: 'https://hb.afl.rakuten.co.jp/hgc/mock/0000002/',
      shopName: 'mockショップ2',
      mediumImageUrls: [{ imageUrl: 'https://picsum.photos/seed/mock2/300/300' }],
    },
    {
      itemCode: 'mock:0000003',
      itemName: '【mock】低反発クッション 腰痛対策',
      itemPrice: 3980,
      itemUrl: 'https://item.rakuten.co.jp/mock/0000003/',
      affiliateUrl: 'https://hb.afl.rakuten.co.jp/hgc/mock/0000003/',
      shopName: 'mockショップ3',
      mediumImageUrls: [{ imageUrl: 'https://picsum.photos/seed/mock3/300/300' }],
    },
    {
      itemCode: 'mock:0000004',
      itemName: '【mock】折りたたみ電動アシスト自転車',
      itemPrice: 98000,
      itemUrl: 'https://item.rakuten.co.jp/mock/0000004/',
      affiliateUrl: 'https://hb.afl.rakuten.co.jp/hgc/mock/0000004/',
      shopName: 'mockショップ4',
      mediumImageUrls: [{ imageUrl: 'https://picsum.photos/seed/mock4/300/300' }],
    },
    {
      itemCode: 'mock:0000005',
      itemName: '【mock】炭酸水メーカー スターターセット',
      itemPrice: 8900,
      itemUrl: 'https://item.rakuten.co.jp/mock/0000005/',
      affiliateUrl: 'https://hb.afl.rakuten.co.jp/hgc/mock/0000005/',
      shopName: 'mockショップ5',
      mediumImageUrls: [{ imageUrl: 'https://picsum.photos/seed/mock5/300/300' }],
    },
  ];
}

// 楽天市場ランキングAPI（総合ランキング、genreId省略）から上位商品を取得する。
// affiliateIdを渡すと、レスポンスの各itemに変換済みのaffiliateUrlが直接含まれる
// （自前でのアフィリエイトリンク変換処理は不要）。
// siteUrl: RWSに「Web Application」として登録したアプリのURL（Referer/Origin検証に使われる）。
export async function fetchRankingItems({ applicationId, accessKey, affiliateId, siteUrl, page = 1 }) {
  const url = new URL(RANKING_ENDPOINT);
  url.searchParams.set('applicationId', applicationId);
  url.searchParams.set('accessKey', accessKey);
  if (affiliateId) url.searchParams.set('affiliateId', affiliateId);
  url.searchParams.set('page', String(page));
  url.searchParams.set('format', 'json');

  const referer = siteUrl ?? 'https://nagi-biz.github.io/RakutenAutoShop/';
  const res = await fetch(url, {
    headers: {
      Referer: referer,
      Origin: new URL(referer).origin,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `楽天ランキングAPIの呼び出しに失敗しました（HTTP ${res.status}）: ${body.slice(0, 300)}`,
    );
  }
  const json = await res.json();
  if (!Array.isArray(json.Items) && !Array.isArray(json.Results)) {
    throw new Error(
      `楽天ランキングAPIのレスポンス形式が想定と異なります: ${JSON.stringify(json).slice(0, 300)}`,
    );
  }
  const results = json.Results ?? json.Items;
  const items = results.map((r) => r.item ?? r.Item ?? r);
  // 実レスポンスは配列が「30位, 29位, ..., 1位」のように rank 降順で返ってくるため、
  // rank昇順（1位が先頭）に並べ替えてから返す。以降のslice(0, N)がそのまま「上位N件」になる。
  items.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  return items;
}

// 商品ジャンルのキーワード判定（楽天買い物ラボ カテゴリ構成案 2026-10-20、shop-strategy作成）。
// 商品名（itemName）に含まれるキーワードで6分類のいずれかに振り分ける簡易ロジック。
// 配列の並び順＝判定の優先順位。先に書いたカテゴリのキーワードに先にマッチする。
// 例：「カラコン」はbeauty判定を先に通すことで、daily側の「コンタクト」判定より優先させている
// （色付きカラーコンタクトは美容目的、無色のワンデーコンタクトは日用品・ヘルスケア目的という想定分け）。
// どのキーワードにも合致しない商品はcategory未設定のまま返す（無理に推測しない）。
const CATEGORY_KEYWORDS = [
  [
    'beauty',
    [
      'コスメ', '美容', '化粧水', '乳液', 'クレンジング', 'シャンプー', 'トリートメント',
      'ヘアケア', 'ヘアオイル', 'ヘアウォーター', 'ファンデ', '美白', 'シートマスク', 'パック',
      '美容液', '毛穴', 'ニキビ', 'ヘッドスクラブ', '頭皮', 'カッサ', 'バーム', 'コラーゲン',
      'うるおい', '保湿', 'レチノール', 'ナイアシンアミド', 'カラコン', 'カラーコンタクト',
      'スキンケア', 'エイジングケア', 'セラム', '導入美容液',
    ],
  ],
  [
    'daily',
    ['おむつ', 'オムツ', 'コンタクト', 'サプリ', 'ティッシュ', '洗剤', '体温計', '紙おむつ', 'マスク（不織布）'],
  ],
  [
    'food',
    [
      '食品', 'グルメ', '鯖', 'さば', 'サバ', '鮭', 'さけ', 'サケ', '米', 'お米', 'ワイン',
      '炭酸水', '餃子', '冷凍食品', 'お菓子', 'スイーツ', 'コーヒー', '飲料', 'つくね', '肉',
      '惣菜', 'おかず', 'ドリンク', 'フルーツ', '野菜',
    ],
  ],
  [
    'home',
    ['収納', 'チェスト', '家具', 'インテリア', '枕', '布団', 'クッション', '寝具', 'ラグ', 'カーテン', '雑貨'],
  ],
  [
    'hobby',
    ['CD', 'DVD', 'フィギュア', 'グッズ', '書籍', 'ブック', 'ゲーム', 'おもちゃ', 'アイドル', 'キャラクター', 'トレカ', 'シール', 'ギフト'],
  ],
  [
    'fashion',
    ['ワンピース', 'ナイトブラ', 'インナーウェア', 'コーデ', 'スカート', 'ニット', 'パーカー', 'バッグ', 'アクセサリー', 'シューズ'],
  ],
];

export function classifyCategory(name) {
  if (!name) return undefined;
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => name.includes(k))) return category;
  }
  return undefined;
}

// 商品APIレスポンスから、記事フロントマターに保存する最小限の形に正規化する。
// itemPriceはAPIレスポンス上は文字列（例:"4173"）で返るため数値化する。
export function normalizeProduct(item, rank) {
  const name = item.itemName;
  return {
    rank: item.rank ?? rank,
    itemCode: item.itemCode,
    name,
    imageUrl:
      item.mediumImageUrls?.[0]?.imageUrl?.replace(/^http:/, 'https:') ??
      item.smallImageUrls?.[0]?.imageUrl?.replace(/^http:/, 'https:') ??
      '',
    price: Number(item.itemPrice),
    shopName: item.shopName,
    affiliateUrl: item.affiliateUrl || item.itemUrl,
    category: classifyCategory(name),
  };
}
