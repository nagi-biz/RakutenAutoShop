// 特集ページ（/features/<slug>/）の定義。
//
// 商品データは src/data/tiktok-products.ts にあり、各商品の featureSlug が
// このファイルの slug と一致するものが、その特集のピックアップ商品になる。
// 特集を追加するときは、ここに1件追加し、商品側に featureSlug を付ける。
// 商品の出典・確認日は ~/workspace/rakuten_tiktok_pr/feature_products_20261125.md。

export interface FeatureDef {
  /** URLスラッグ（/features/<slug>/） */
  slug: string;
  /** 見出しの絵文字 */
  emoji: string;
  title: { ja: string; en: string };
  /** 導入文（短く、誇大表現なし） */
  intro: { ja: string; en: string };
}

export const FEATURES: FeatureDef[] = [
  {
    slug: 'winter-nabe',
    emoji: '🍲',
    title: { ja: '冬の鍋特集', en: 'Winter Hot Pot Picks' },
    intro: {
      ja: '寒い日に家で鍋をするための道具と具材を集めました。土鍋、カセットこんろ、お取り寄せのもつ鍋セットに、久世福商店・にんべんの出汁、水餃子やきのこの具材、取り分けの器まで、鍋の準備に必要なものをまとめています。第3弾では、海底撈の麻辣火鍋の素や、ミツカン・エバラ・ダイショーの市販鍋つゆ、久原のあごだしつゆなど、スーパーでおなじみの鍋つゆ・出汁シリーズも加えました。',
      en: 'Everything you need for a hot pot night at home: clay pots, a tabletop cassette stove, a Hakata motsunabe set delivered to your door, dashi from Kuzefuku and Ninben, gyoza and mushroom ingredients, and the bowls and dishes for serving. Round 3 also adds supermarket nabetsuyu and dashi staples: Haidilao mala hot pot base, ready-made hot pot soups from Mizkan, Ebara and Daisho, and Kuhara ago-dashi tsuyu.',
    },
  },
  {
    slug: 'christmas-gifts',
    emoji: '🎄',
    title: { ja: 'クリスマスギフト特集', en: 'Christmas Gift Picks' },
    intro: {
      ja: 'クリスマスの贈り物に選んだギフトを集めました。美濃焼の食器セットに、ヨックモックと銀座千疋屋のスイーツ、SABONとAesopのコスメを加えた、箱入り・ギフト向けのラインアップです。第3弾では、リンツとロクシタンのアドベントカレンダー、限定生産のトミカ アドベントカレンダー、天然素材のクリスマスリース、LEDイルミネーションライトとLEDキャンドル、サンタコスチュームなど、ジャンルを広げたクリスマスグッズも追加しました。',
      en: 'Gift picks for Christmas: Mino-ware tableware sets, sweets from Yoku Moku and Ginza Sembikiya, and cosmetics from SABON and Aesop — boxed, gift-ready items. Round 3 broadens the mix with advent calendars from Lindt and L\'Occitane, a limited-production Tomica advent calendar, a natural-material Christmas wreath, LED illumination lights, LED candles, and a Santa costume.',
    },
  },
];

export const featureBySlug = (slug: string) =>
  FEATURES.find((f) => f.slug === slug);
