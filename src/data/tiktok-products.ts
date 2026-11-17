/**
 * TikTok（ALICE World）で紹介した商品のブログ側データ。
 *
 * 出典は ~/workspace/rakuten_tiktok_pr/daily/<日付>/{overseas,japan}/<商品>.md の
 * 「商品」セクション（その日にライブ確認した事実のみ）と、同日の
 * affiliate-links.md（価格・短縮リンクの最終確認値）。
 * 価格は確認日時点のもの。変動しうるため、ページ側でもその旨を表示する。
 * 新しい動画セットが承認・投稿されたら、その日の .md と affiliate-links.md から
 * ここへ1件ずつ追加する（推測で補わない）。
 */
export interface TiktokProduct {
  /** URLスラッグ（/products/<slug>/） */
  slug: string;
  /** 商品名（日本語表示名） */
  name: string;
  shopName: string;
  /** 確認済み価格（円・税込/税抜の別は商品ページ表示に従う） */
  price: number;
  /** 価格の補足（バリエーション等がある場合） */
  priceNote?: string;
  /** 送料の表示（例：送料無料／送料¥295） */
  shipping: string;
  /** ジャンル表示名（商品 .md のジャンル表記） */
  genre: string;
  /** 商品 .md の事実だけから作った短い説明 */
  description: string;
  /** 楽天アフィリエイト短縮リンク */
  affiliateUrl: string;
  /** 紹介したTikTokアカウント */
  account: '@aliceworld.japan' | '@alice.world26';
  /** 紹介日（動画制作・投稿の日） */
  featuredDate: string;
  /** 紹介したTikTok動画のURL（判明している場合） */
  tiktokUrl?: string;
}

export const TIKTOK_PRODUCTS: TiktokProduct[] = [
  // ---- 2026-11-17 海外向け @aliceworld.japan ----
  {
    slug: 'knife',
    name: '貝印 関孫六 匠創 ペティナイフ 120mm AB5163',
    shopName: 'ホームセンターバロー 楽天市場店',
    price: 2580,
    shipping: '送料無料（メール便）',
    genre: 'キッチン調理器具',
    description:
      '刃渡り120mm・重量65gのオールステンレス一体型ペティナイフ。刃体はモリブデンバナジウムステンレス刃物鋼で、両刃・左右兼用、食洗機対応。生産国は日本で、刃物の名産地・岐阜県関市のブランド「関孫六」の製品です。',
    affiliateUrl: 'https://a.r10.to/hF6C3j',
    account: '@aliceworld.japan',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@aliceworld.japan/video/7709131964250443014',
  },
  {
    slug: 'incense',
    name: '日本香堂 かゆらぎ 茉莉花（まつりか）スティック 40本入',
    shopName: '明りと香り本舗',
    price: 1210,
    shipping: '送料¥295（メール便）',
    genre: '健康・リラクゼーション',
    description:
      '爽やかで明るいジャスミンの香りのスティックタイプのお香。40本入りで香立が付き、燃焼時間は約25分です。',
    affiliateUrl: 'https://a.r10.to/hgpPbS',
    account: '@aliceworld.japan',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@aliceworld.japan/video/7709134251249241345',
  },
  {
    slug: 'hoshimo',
    name: '芋國屋 干し芋 訳あり 1kg（国産・無添加・紅はるか）',
    shopName: '芋國屋',
    price: 2990,
    priceNote: '10%OFFクーポン対象（2026-11-17確認時）',
    shipping: '送料無料',
    genre: '食品・スイーツ',
    description:
      '茨城県産の紅はるかだけを使った干し芋1kg。原材料はさつまいものみで、切り落としの訳あり品のため大きさ・形・食感に差があります。賞味期限はお届け日から約21日間です。',
    affiliateUrl: 'https://a.r10.to/hgOAtg',
    account: '@aliceworld.japan',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@aliceworld.japan/video/7709135967583603974',
  },
  {
    slug: 'nanolabo',
    name: 'なのらぼ 足快バスマット レギュラー',
    shopName: 'くらしのもり',
    price: 7480,
    priceNote: '全11柄とも同価格（単品）',
    shipping: '送料無料',
    genre: '日用品・生活雑貨',
    description:
      '珪藻土・消石灰（日本国産）の足ふきマット。サイズは約42.5×57.5cm、厚さ9mm、重さ1.8kg。全11種類の柄から選べます。',
    affiliateUrl: 'https://a.r10.to/hgUC58',
    account: '@aliceworld.japan',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@aliceworld.japan/video/7709138377123056897',
  },
  {
    slug: 'tymug',
    name: '1616/arita japan TY Mug ホワイト（有田焼）',
    shopName: 'FAVRAS／ファブラス 雑貨＆ギフト',
    price: 2310,
    shipping: '送料¥770',
    genre: '食器・テーブルウェア',
    description:
      '有田焼の磁器マグカップ。容量は約260mlで、電子レンジ・食洗機に対応。クラフトボックス入りです。',
    affiliateUrl: 'https://a.r10.to/hPIkBd',
    account: '@aliceworld.japan',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@aliceworld.japan/video/7709138972114554113',
  },
  {
    slug: 'biore',
    name: 'ビオレUV アクアリッチ ウォータリーエッセンス 70g（花王）',
    shopName: 'ASS SHOP',
    price: 1080,
    shipping: '送料無料',
    genre: 'スキンケア',
    description:
      '花王の日焼け止めエッセンス、内容量70g。パッケージ表示はSPF50+／PA++++です。',
    affiliateUrl: 'https://a.r10.to/hYiTuS',
    account: '@aliceworld.japan',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@aliceworld.japan/video/7709139653839834369',
  },
  {
    slug: 'brush',
    name: '池本刷子工業 IKMT ブラッシングブラシ 小 豚毛 IKH-2224',
    shopName: 'キュアマート',
    price: 2200,
    shipping: '送料無料',
    genre: 'ヘアケア',
    description:
      '豚毛100%と天然木の日本製ブラッシングブラシ。全長約17cmのスモールサイズで、かたさはM（ふつう）、ずらし植毛です。',
    affiliateUrl: 'https://a.r10.to/hYcf18',
    account: '@aliceworld.japan',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@aliceworld.japan/video/7709140828559576372',
  },
  {
    slug: 'woozoo',
    name: 'アイリスオーヤマ WOOZOO サーキュレーター PCF-HD15EC（グレー）',
    shopName: 'アイリスオーヤマ公式 楽天市場店',
    price: 3080,
    shipping: '送料無料',
    genre: '家電',
    description:
      '8畳対応のサーキュレーター。風量3段階、自動左右首振り・上下は手動で約90°まで調整でき、全分解して丸洗いできます。リモコン付きです。',
    affiliateUrl: 'https://a.r10.to/hPOZP8',
    account: '@aliceworld.japan',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@aliceworld.japan/video/7709142517756726580',
  },
  {
    slug: 'furoshiki',
    name: 'むす美 100 鳥獣人物戯画 風呂敷 約100cm（ターコイズブルー）',
    shopName: '和装通販 きものレンタル 西織',
    price: 2799,
    shipping: '送料無料（メール便）',
    genre: 'ファッション・小物',
    description:
      'オーガニックコットン100%（GOTS認証）の約100cm風呂敷。12世紀の絵巻「鳥獣人物戯画」（高山寺公認）の柄で、帯（紐）が付いています。',
    affiliateUrl: 'https://a.r10.to/hXdnft',
    account: '@aliceworld.japan',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@aliceworld.japan/video/7709143472598469940',
  },
  {
    slug: 'mdnote',
    name: 'ミドリ MDノート＜A5＞方眼罫（商品番号15386006）',
    shopName: '商芸文具楽天市場店',
    price: 1210,
    shipping: '送料¥260（メール便）',
    genre: '文房具',
    description:
      'MD用紙を使ったA5サイズのノート。176ページ、5mm方眼罫で、糸かがり綴じのため開きやすい作りです。',
    affiliateUrl: 'https://a.r10.to/h9TTAS',
    account: '@aliceworld.japan',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@aliceworld.japan/video/7709145285674405172',
  },
  {
    slug: 'nyan',
    name: 'HARIO にゃんプレダブル（有田焼ペット食器）',
    shopName: 'HARIO公式NETSHOP楽天市場店',
    price: 3300,
    shipping: '送料無料',
    genre: 'ペット用品',
    description:
      '両面使える有田焼の猫用フードボウル。浅型面は実用容量80ml（フード用）、深型面は200ml（水用）で、滑り止めシリコーンマット付き。熱湯・電子レンジ・食洗機に対応します。',
    affiliateUrl: 'https://a.r10.to/h5A3cp',
    account: '@aliceworld.japan',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@aliceworld.japan/video/7709174860454546740',
  },
  // ---- 2026-11-17 日本向け @alice.world26 ----
  {
    slug: 'bumbum',
    name: 'ソル・デ・ジャネイロ ブラジリアン バムバムクリーム 75ml',
    shopName: 'coscora（楽天海外通販）',
    price: 4740,
    priceNote: '2026-11-17のリンク作成時に確認した価格（同日の商品ページ確認時は¥4,720）',
    shipping: '送料無料',
    genre: 'ボディケア',
    description:
      '内容量75mlのボディクリーム。香りはCheirosa 62（ピスタチオ・ソルティッドキャラメル・バニラなど）。アメリカのセフォラで6年連続No.1と報じられた人気商品です（Business of Fashion）。取り寄せ商品のため、発送は4営業日以内・到着は14日以内が目安と表示されています。',
    affiliateUrl: 'https://a.r10.to/hYW4dN',
    account: '@alice.world26',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@alice.world26/video/7709130501558242612',
  },
  {
    slug: 'grip',
    name: 'ALL OUT パワーグリップ プロ',
    shopName: 'トリプルエス（ALL OUT公式楽天市場店）',
    price: 2980,
    shipping: '送料無料',
    genre: 'スポーツ・アウトドア',
    description:
      'トレーニング用のパワーグリップ。サイズはXS・S・M-L・XLの4種（M-Lは手首周囲16〜20cmが目安）で、カラーは9色。耐荷重318kgの強度試験をクリアしています（商品情報より）。',
    affiliateUrl: 'https://a.r10.to/hgo1c0',
    account: '@alice.world26',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@alice.world26/video/7709133091146665223',
  },
  {
    slug: 'torriden',
    name: 'Torriden ダイブイン 低分子ヒアルロン酸セラム 50ml（リニューアル品）',
    shopName: 'Torriden楽天市場店',
    price: 2420,
    priceNote: 'リニューアル品の価格（同ページで旧品¥1,650も選択可）',
    shipping: '送料無料',
    genre: 'スキンケア',
    description: '低分子ヒアルロン酸のセラム、内容量50ml（リニューアル品）。韓国コスメTorridenの日本公式店舗の出品です。',
    affiliateUrl: 'https://a.r10.to/hPuAij',
    account: '@alice.world26',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@alice.world26/video/7709133866958654721',
  },
  {
    slug: 'peripera',
    name: 'peripera インクベルベット 39 サニーオレンジ',
    shopName: 'ぽちべる（Pochi Bell）',
    price: 330,
    shipping: '送料¥550',
    genre: 'メイク・コスメ',
    description:
      '内容量4gのリップティント、色番39サニーオレンジ（韓国製）。ふわふわの生クリームテクスチャーで、塗り立ての鮮明な色が密着するベルベットリップです（商品説明より）。',
    affiliateUrl: 'https://a.r10.to/hP9Uqt',
    account: '@alice.world26',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@alice.world26/video/7709134808466656564',
  },
  {
    slug: 'ball',
    name: 'PROIRON バランスボール 55cm',
    shopName: 'PROIRON楽天市場店',
    price: 2199,
    priceNote: '55cmの価格（65cm・75cmは¥2,199〜2,499）',
    shipping: '送料無料',
    genre: 'スポーツ・アウトドア',
    description:
      'アンチバースト仕様・耐荷重300kgのジムボール。厚さ2mmのPVC製で、ハンドポンプが付属します。サイズは55cm・65cm・75cmから選べます。',
    affiliateUrl: 'https://a.r10.to/hYTpeg',
    account: '@alice.world26',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@alice.world26/video/7709141115072449793',
  },
  {
    slug: 'stanley',
    name: 'STANLEY H2.0 真空クエンチャー 0.89L',
    shopName: 'ホッチポッチ自由が丘 WEB shop',
    price: 7370,
    priceNote: '0.89Lの価格（0.59Lは¥6,820）',
    shipping: '商品ページでご確認ください',
    genre: '日用品・生活雑貨',
    description:
      'ハンドルとストロー付きの真空断熱タンブラー。容量0.89Lで、保冷効力は8度以下を6時間キープ（表示値）。ストロー・直飲み・カバーの3WAY仕様で食洗機も使えます。冷たい飲み物専用です。',
    affiliateUrl: 'https://a.r10.to/h5tf57',
    account: '@alice.world26',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@alice.world26/video/7709142109244214529',
  },
  {
    slug: 'bruno',
    name: 'BRUNO コンパクトホットプレート（ホワイト）BOE021',
    shopName: 'BRUNOブルーノ公式楽天市場店',
    price: 12100,
    shipping: '送料無料',
    genre: '家電',
    description:
      '平面プレートとたこ焼きプレートの2種が付くコンパクトホットプレート。温度調節は65℃〜250℃で、プレートはフッ素樹脂コート。1〜3人用サイズです。',
    affiliateUrl: 'https://a.r10.to/hgqtMP',
    account: '@alice.world26',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@alice.world26/video/7709143119157136641',
  },
  {
    slug: 'ichiran',
    name: '一蘭ラーメン 博多細麺ストレート 一蘭特製赤い秘伝の粉付 5食入',
    shopName: 'プレコハウス（PURECO HOUSE）',
    price: 2391,
    shipping: '送料¥600',
    genre: '食品・スイーツ',
    description:
      '博多細麺75g×5、液体スープ×5、一蘭特製赤い秘伝の粉×5のセット（内容量645g）。とんこつ味です。',
    affiliateUrl: 'https://a.r10.to/hPWHVu',
    account: '@alice.world26',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@alice.world26/video/7709156845289606406',
  },
  {
    slug: 'rope',
    name: 'PROIRON エア縄跳び 2WAY カウンター付き',
    shopName: 'PROIRON楽天市場店',
    price: 2499,
    shipping: '送料無料',
    genre: 'スポーツ・アウトドア',
    description:
      '3mのロープとボール付きの短いコードを付け替える2WAY縄跳び。カウンターが回数・時間・消費カロリーを表示します。グリップのおもり（1個60g）は取り外しでき、ロープは切らずに長さを変えられます。保証1年。',
    affiliateUrl: 'https://a.r10.to/hYh75y',
    account: '@alice.world26',
    featuredDate: '2026-11-17',
    tiktokUrl: 'https://www.tiktok.com/@alice.world26/video/7709157927776521473',
  },
  // ---- 2026-11-16 海外向け @aliceworld.japan ----
  {
    slug: 'warosoku',
    name: '中村ローソク 和ろうそく「2匁5本セット 京乃五節句」',
    shopName: 'BECOS伝統工芸楽天市場店',
    price: 4300,
    shipping: '送料無料',
    genre: 'インテリア・季節用品',
    description:
      'ヌカ蝋を使い、職人が一本一本手作りする和ろうそく5本セット（燃焼時間約50分）。京絵師が手描きした五節句の花柄（桃・桜・菖蒲・朝顔・菊など）入りで、紙箱に入っています。植物性の原料のみを使い、西洋ろうそくに比べて油煙や煤が少ないのが特徴です。',
    affiliateUrl: 'https://a.r10.to/hgq1eD',
    account: '@aliceworld.japan',
    featuredDate: '2026-11-16',
    tiktokUrl: 'https://www.tiktok.com/@aliceworld.japan/video/7708745512035421446',
  },
  {
    slug: 'matcha',
    name: '伊藤久右衛門 宇治抹茶生チョコレート 16粒入',
    shopName: '抹茶スイーツ宇治茶 伊藤久右衛門',
    price: 1393,
    shipping: '送料¥899（クール便）',
    genre: '食品・スイーツ',
    description:
      '宇治抹茶の生チョコレート16粒入り（総重量120g）。要冷蔵（10℃以下）で、賞味期限は約30日です。',
    affiliateUrl: 'https://a.r10.to/hPYikd',
    account: '@aliceworld.japan',
    featuredDate: '2026-11-16',
    tiktokUrl: 'https://www.tiktok.com/@aliceworld.japan/video/7708895045016915220',
  },
  {
    slug: 'tawashi',
    name: '亀の子束子 1号',
    shopName: '私の部屋楽天市場店',
    price: 484,
    shipping: '送料¥660',
    genre: '日用品・生活雑貨',
    description:
      'パーム（ココナッツ繊維）のたわし。サイズは約 幅8×奥行4.8×高さ10cm。根菜類の泥落としや薄皮むき、鉄のフライパン・ザルなどの調理器具洗いに適しています。',
    affiliateUrl: 'https://a.r10.to/hP4wGg',
    account: '@aliceworld.japan',
    featuredDate: '2026-11-16',
    tiktokUrl: 'https://www.tiktok.com/@aliceworld.japan/video/7708895854668582165',
  },
  {
    slug: 'mino-bowls',
    name: '美濃焼 北欧フラワー ボウル 5柄セット（日本製）',
    shopName: 'こだわり食器と雑貨のお店 irodori',
    price: 4070,
    shipping: '送料無料',
    genre: '食器・テーブルウェア',
    description:
      '日本製・美濃焼の磁器ボウルの5柄セット。径約12.5cm・満水容量約480mlで、電子レンジ・食洗機に対応します。',
    affiliateUrl: 'https://a.r10.to/hPz1Qw',
    account: '@aliceworld.japan',
    featuredDate: '2026-11-16',
    tiktokUrl: 'https://www.tiktok.com/@aliceworld.japan/video/7708896605805530389',
  },
  {
    slug: 'hadalabo',
    name: '肌ラボ 極潤プレミアム ヒアルロン液 170mL（ロート製薬）',
    shopName: 'MTSHOP2018',
    price: 1020,
    shipping: '送料¥550',
    genre: 'スキンケア',
    description:
      'ロート製薬のヒアルロン酸配合化粧水（170mL）。とろみのあるテクスチャーで、無香料・無着色・オイルフリー・アルコールフリーです（商品説明より）。',
    affiliateUrl: 'https://a.r10.to/hPKT6b',
    account: '@aliceworld.japan',
    featuredDate: '2026-11-16',
    tiktokUrl: 'https://www.tiktok.com/@aliceworld.japan/video/7708918114192280840',
  },
  // ---- 2026-11-16 日本向け @alice.world26 ----
  {
    slug: 'olaplex-no3',
    name: 'オラプレックス No.3 ヘアパーフェクター 100ml',
    shopName: 'プロ用ヘア＆コスメShopネッツビー',
    price: 3740,
    shipping: '送料無料',
    genre: 'ヘアケア',
    description:
      'シャンプー前に使う週1〜2回のスペシャルトリートメント（内容量100ml）。ぬれた髪になじませて10分以上置いてから洗い流します。シリコンフリー・硫酸塩フリー・パラベンフリーです。',
    affiliateUrl: 'https://a.r10.to/hP5MyC',
    account: '@alice.world26',
    featuredDate: '2026-11-16',
    tiktokUrl: 'https://www.tiktok.com/@alice.world26/video/7708741921467927809',
  },
  {
    slug: 'buldak',
    name: '三養ジャパン ブルダック炒め麺 袋麺 5食パック（オリジナル）',
    shopName: 'JET PRICE',
    price: 1107,
    shipping: '送料¥590',
    genre: '食品・スイーツ',
    description:
      '韓国の激辛炒め麺の5食パック。沸騰したお湯550mlに麺を入れて約5分ゆで、粉末スープは食べる直前に入れます。刻んだ海苔とごま入り。辛いのが苦手な方はご注意ください（商品の注意書きより）。',
    affiliateUrl: 'https://a.r10.to/hP15kR',
    account: '@alice.world26',
    featuredDate: '2026-11-16',
    tiktokUrl: 'https://www.tiktok.com/@alice.world26/video/7708742284518362369',
  },
  {
    slug: 'romand',
    name: 'ロムアンド ジューシーラスティングティント 25 BARE GRAPE',
    shopName: 'romand_official（ロムアンド公式）',
    price: 1320,
    shipping: '送料無料',
    genre: 'メイク・コスメ',
    description:
      '内容量5.5gのリップティント。25番 BARE GRAPEは、モーブピンクにほんのりベージュを混ぜたくすみピンクで、シアーな発色です。',
    affiliateUrl: 'https://a.r10.to/hFoFot',
    account: '@alice.world26',
    featuredDate: '2026-11-16',
    tiktokUrl: 'https://www.tiktok.com/@alice.world26/video/7708742582582414593',
  },
];

export const tiktokProductBySlug = (slug: string) =>
  TIKTOK_PRODUCTS.find((p) => p.slug === slug);
