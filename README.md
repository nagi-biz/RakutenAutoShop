# 楽天お買い物ラボ（RakutenAutoShop）

楽天市場の総合ランキングから商品を自動で取得し、Claude CLIで紹介記事を生成、
GitHub Pages上の静的サイトとして毎日自動で公開するツールです。
`NoteAutoPost`（note.com向け記事自動投稿）の兄弟プロジェクトで、
記事生成の方式（Claude CLI呼び出し・状態管理）は共通ですが、
公開先はnote.comではなく独自の静的サイト（GitHub Pages）です。

## コストについて

記事本文の生成は `NoteAutoPost` と同じく **Claude Code CLI（`claude -p`）** を使うため、
サブスクリプション契約内で完結し追加課金は発生しません。
ホスティングは **GitHub Pages（無料）**、商品データ取得は **楽天ウェブサービスAPI（無料）** です。

## 全体の流れ

```
楽天市場ランキングAPI（総合ランキング、1〜30位を取得）
   ↓
6記事×5商品に分割（1〜5位, 6〜10位, ... 26〜30位）
   ↓
Claude CLIで記事ごとに紹介文を生成
   ↓
src/content/articles/ にMarkdownとして保存
   ↓
git commit → push
   ↓
GitHub Actionsが自動ビルド・GitHub Pagesへデプロイ
```

デフォルトでは**毎日ランキング1〜30位を丸ごとカバー**する設定（`articlesPerDay: 6` ×
`productsPerArticle: 5`）になっています。この設定の場合、直近の重複除外は行いません
（上位商品が連日ランクインするのは当然で、それをそのまま見せるのが正しい挙動のため）。
`articlesPerDay × productsPerArticle` を取得件数（30）より小さくすると、自動的に
「直近30日以内に紹介済みの商品を除外して厳選する」モードに切り替わります。

## セットアップ手順（初回のみ・ユーザー側の作業）

このツール自体はセットアップ済みですが、以下は**楽天・GitHub側の手続きが必要**なため、
ユーザー自身で行ってください。

### 1. 楽天アフィリエイトへの会員登録

1. [楽天アフィリエイト](https://affiliate.rakuten.co.jp/)にアクセスし会員登録（審査あり、通常数日）
2. 登録後、管理画面から **アフィリエイトID** を確認できます

### 2. 楽天ウェブサービス（RWS）でアプリIDを発行

1. [楽天ウェブサービス](https://webservice.rakuten.co.jp/)にログイン（楽天会員IDでOK）
2. 「アプリID発行」から新規アプリを登録
   - Application type: **Web Application**
   - Allowed websites: **自分のサイトのドメイン**（例: `nagi-biz.github.io`。楽天側のドメインではない）
   - API Access Scopes: **Rakuten Ichiba API のみ**でよい
3. 発行された **アプリケーションID（applicationId）** と **アクセスキー（accessKey、`pk_`で始まる文字列）** を控える
   （2026年の基盤刷新以降、両方が必須になっています）

### 3. 認証情報の設定

`rakuten-config.example.json` をコピーして `rakuten-config.json` を作成し、
上記で取得した値を入れてください（このファイルはgit管理対象外です）。

```json
{
  "applicationId": "取得したアプリケーションID",
  "accessKey": "取得したアクセスキー（pk_で始まる文字列）",
  "affiliateId": "取得したアフィリエイトID",
  "siteUrl": "https://nagi-biz.github.io/RakutenAutoShop/"
}
```

`siteUrl` はRWS側に登録した「Allowed websites」のURLと一致させてください。
一致しないと楽天API側から `REQUEST_CONTEXT_BODY_HTTP_REFERRER_MISSING` エラーで拒否されます。

### 4. GitHubリポジトリの作成・GitHub Pages有効化

1. GitHub上にこのフォルダ用のリポジトリを作成し、`git push`する
2. リポジトリの **Settings → Pages → Source** を **GitHub Actions** に設定
3. `main` ブランチにpushすると `.github/workflows/deploy.yml` が自動でビルド・公開します
4. リポジトリ名を `RakutenAutoShop` 以外にした場合は、`astro.config.mjs` の `base` を
   リポジトリ名に合わせて変更してください

### 5. Windowsタスクスケジューラへの登録（毎日自動実行したい場合）

1. 「タスクスケジューラ」を開き、新しいタスクを作成
2. トリガー：毎日好きな時刻
3. 操作：プログラム/スクリプトに `powershell.exe`、引数に
   `-ExecutionPolicy Bypass -File "C:\Users\yuki_\RakutenAutoShop\run-daily.ps1"` を指定

## 動作確認（認証情報がまだ揃っていなくても可能）

```bash
npm install
node generate.mjs --mock      # ダミー商品データで記事生成のみ確認（pushしない）
npm run build                 # Astroビルドが通るか確認
npm run dev                   # ローカルプレビュー
```

認証情報が揃ったら、まず `--mock` なしで1回だけ手動実行し、実データが正しく
取得・埋め込みされることを確認してから `config.json` の `publish.enabled`/`live` を
有効にしてください。

## 設定ファイル

| ファイル | 内容 |
|---|---|
| `config.json`（gitignore対象） | 1日あたりの記事数・1記事あたりの商品数・公開設定 |
| `rakuten-config.json`（gitignore対象） | 楽天アプリID・アフィリエイトID（機密） |
| `state/history.json`（gitignore対象） | 直近紹介済み商品コードの履歴（30日で自動トリム） |
| `state/published-articles.json`（gitignore対象） | 公開実績台帳 |

`publish.enabled: false` にすると生成のみ（git commitもしない）、
`publish.live: false` にすると**ローカルコミットのみ**（pushしない＝実質下書き）になります。
問題が起きた場合はまず `publish.live` を `false` にして安全モードに戻してください。

## サイトを検索エンジンに見つけてもらう（周知の第一歩）

サイトを作っただけでは検索結果には出てきません。以下はユーザー側の一度きりの手続きです。

### 1. Google Search Console
1. [Google Search Console](https://search.google.com/search-console)にアクセスし、
   プロパティとして `https://nagi-biz.github.io/RakutenAutoShop/` を追加
2. 所有権確認は「URLプレフィックス」→「HTMLタグ」方式が簡単
   （発行された`<meta name="google-site-verification" ...>`タグを
   `src/layouts/BaseLayout.astro`の`<head>`内に追加してpushすれば確認できます。私に貼り付け内容を
   教えてもらえれば追加します）
3. 確認できたら「サイトマップ」メニューから `sitemap-index.xml` を送信
   （フルURL: `https://nagi-biz.github.io/RakutenAutoShop/sitemap-index.xml`）

### 2. Bing Webmaster Tools
1. [Bing Webmaster Tools](https://www.bing.com/webmasters)でGoogle Search Consoleからのインポートが可能（ほぼワンクリック）
2. 同様にサイトマップURLを送信

これで数日〜数週間かけて検索エンジンにインデックスされ始めます。すぐには効果が出ないので、
気長に待つ必要があります。

### 3. SNSでの自動告知（将来の拡張）
新記事の公開ごとにX(Twitter)へタイトル+リンクを自動ポストする仕組みも追加できます。
`NoteAutoPost`と同様、X Developer Portalでのアプリ登録（審査あり）が必要になるので、
やりたくなったタイミングで声をかけてください。

## リスク・注意点

- **記事内容**：Claudeには実際の商品名・価格・ショップ名以外の事実（スペック等）を
  捏造しないよう指示していますが、生成物は必ず目視確認する運用を推奨します。
- **アフィリエイトリンクの表示義務**：各ページに「アフィリエイトリンクを含みます」の
  表示（景品表示法のステルスマーケティング規制対応）を`BaseLayout.astro`に常設しています。
  文言は実態に合わせて見直してください。
- **成果測定**：現状、クリック数・売上は楽天アフィリエイトの管理画面から手動でCSVを
  確認する運用です（自動レポートAPIは提供されていないため）。ジャンル別の自動学習
  ループ（`NoteAutoPost/learn.mjs`のような仕組み）は将来の拡張候補です。

## ファイル構成

```text
RakutenAutoShop/
  generate.mjs              … メインスクリプト（取得・生成・保存・公開の統括）
  publish-git.mjs           … git commit/pushの実行（note版のPlaywright投稿の代替）
  lib/rakuten.mjs           … 楽天ランキングAPI呼び出し・モックデータ
  lib/state.mjs             … 状態JSON読み書き・日付ヘルパー
  config.example.json       … config.jsonのひな形
  rakuten-config.example.json … rakuten-config.jsonのひな形
  run-daily.ps1             … タスクスケジューラ用ラッパー
  src/content.config.ts     … 記事コレクションのスキーマ定義
  src/content/articles/     … 生成された記事(.md)。サイト本体
  src/pages/                … 一覧・詳細ページ
  .github/workflows/deploy.yml … GitHub Pagesへの自動デプロイ
  state/                    … 履歴・実績（自動生成、gitignore対象）
  logs/                     … 実行ログ（自動生成、gitignore対象）
```
