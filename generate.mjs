// メインスクリプト：楽天ランキング取得 → Claude CLIで紹介記事生成 →
// src/content/articles/ にMarkdown保存 → (--publish時) git commit/push まで統括する。
// NoteAutoPost/generate.mjs と同じ構成方針（spawnでのclaude -p呼び出し、
// TITLE:/BODY:の固定ラベル出力契約、--mock/--publishフラグ）を踏襲している。

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadJson, saveJson, todayStr, trimOlderThan } from './lib/state.mjs';
import { fetchRankingItems, mockRankingItems, normalizeProduct } from './lib/rakuten.mjs';
import { publishToGit } from './publish-git.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MOCK = process.argv.includes('--mock');
const DO_PUBLISH = process.argv.includes('--publish');

const CONFIG_PATH = path.join(ROOT, 'config.json');
const RAKUTEN_CONFIG_PATH = path.join(ROOT, 'rakuten-config.json');
const HISTORY_PATH = path.join(ROOT, 'state', 'history.json');
const PUBLISHED_PATH = path.join(ROOT, 'state', 'published-articles.json');
const ARTICLES_DIR = path.join(ROOT, 'src', 'content', 'articles');

const HISTORY_TRIM_DAYS = 30;

const logLines = [];
function log(msg) {
  console.log(msg);
  logLines.push(`[${new Date().toISOString()}] ${msg}`);
}

function flushLog() {
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '')
    .replace('T', '_')
    .slice(0, 15);
  const logPath = path.join(ROOT, 'logs', `${stamp}.log`);
  mkdirSync(path.dirname(logPath), { recursive: true });
  writeFileSync(logPath, logLines.join('\n') + '\n', 'utf-8');
}

const CLAUDE_DISALLOWED_TOOLS =
  'Bash Edit Write NotebookEdit WebFetch WebSearch Agent Read Glob Grep Artifact';

// NoteAutoPost/generate.mjs の runClaudeCLI と同じ方式（stdin経由でプロンプトを渡し、
// shell:trueでclaude.cmdを起動、タイムアウト付き）。
function runClaudeCLI(prompt, { timeoutMs = 5 * 60 * 1000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'claude',
      ['-p', '--output-format', 'text', '--disallowedTools', CLAUDE_DISALLOWED_TOOLS],
      { shell: true, windowsHide: true },
    );

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`claude CLIがタイムアウトしました（${timeoutMs}ms）`));
    }, timeoutMs);

    child.stdout.on('data', (d) => (stdout += d.toString('utf-8')));
    child.stderr.on('data', (d) => (stderr += d.toString('utf-8')));
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`claude CLIを起動できませんでした: ${err.message}`));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`claude CLIがエラー終了しました（code ${code}）: ${stderr.slice(0, 500)}`));
        return;
      }
      resolve(stdout.trim());
    });

    child.stdin.write(prompt, 'utf-8');
    child.stdin.end();
  });
}

const SAFETY_RULES = `
- 実在しない仕様・効果・数値を捏造しない（渡された商品名・価格・ショップ名以外の事実を断定しない）
- 誇大広告・断定的な医療/健康効果を謳わない（「〜かもしれません」程度の柔らかい表現にとどめる）
- 著作権侵害・他者の誹謗中傷を含めない
`.trim();

const NATURAL_STYLE_RULES = `
- 「いかがでしたか」「〜てみてはいかがでしょうか」等のAIっぽい定型結び文句を避ける
- 箇条書きだけで済ませず、実際に使うシーンを想像できる具体的な文章にする
- 5商品それぞれに1〜2文程度の紹介コメントをつける（順位・価格帯・どんな人に向くかが伝わるように）
`.trim();

function buildPrompt(products) {
  const productList = products
    .map((p, i) => `${i + 1}位: ${p.name} / ¥${p.price.toLocaleString('ja-JP')} / 販売店: ${p.shopName}`)
    .join('\n');

  return `
あなたは楽天市場の売れ筋商品を紹介するアフィリエイトサイトのライターです。
以下の商品リスト（実際の楽天ランキング上位${products.length}件）をもとに、紹介記事を書いてください。

【商品リスト】
${productList}

【執筆ルール】
${SAFETY_RULES}
${NATURAL_STYLE_RULES}
- 記事全体で600〜1000文字程度
- 冒頭に短い導入文（なぜ今週このラインナップなのか等）を書く
- 各商品の紹介は順位が分かるように書く（見出しは付けなくてよい、地の文でよい）
- 末尾に「気になったものがあれば商品ページもチェックしてみてください」程度の軽い一言を入れる

【出力形式（厳守）】
TITLE: (記事タイトル。数字を含め30文字前後)
BODY:
(本文)
`.trim();
}

function parseArticle(text) {
  const titleMatch = text.match(/TITLE:\s*(.+)/);
  const bodyMatch = text.match(/BODY:\s*([\s\S]*)/);
  if (!titleMatch || !bodyMatch) {
    throw new Error('Claude CLIの出力形式を解析できませんでした（TITLE/BODYが見つかりません）');
  }
  return {
    title: titleMatch[1].trim(),
    body: bodyMatch[1].trim(),
  };
}

// 2026-09-09/09-10 の記事重複（reports/2026-10-21_楽天買い物ラボ_記事重複調査.md）を受けた再発防止策。
// 楽天総合ランキングが複数日停滞すると、articlesPerDay×productsPerArticleが
// ランキング総数以上の設定では「今日のランキングをそのまま出す」分岐（下記）が
// 履歴チェックを素通りし、前回と事実上同一の記事が生成されてしまう。
// ここでは「今日のランキングをそのまま出す」設計自体は変えず（それが意図した挙動のため）、
// 直前の生成日の記事と比べて明らかに同一内容になっている場合だけ検知し、
// フロントマターに duplicateCheck を残して公開前チェック（shop-release）の目に留まるようにする。
const DUPLICATE_ITEMCODE_OVERLAP_THRESHOLD = 0.8; // 5商品中4件以上一致なら要注意
const DUPLICATE_TITLE_SIMILARITY_THRESHOLD = 0.75; // タイトルの言い回しがほぼ同じ場合の補助判定

// 直近で記録された日付のうち、今日より前の最新日のものだけを「直前の生成分」として取り出す。
// published-articles.json は複数記事をフラットな配列で持つため、日付でグルーピングしてから選ぶ。
function getPriorArticles(published, todayDate) {
  const priorDates = [...new Set(published.map((p) => p.date))].filter((d) => d < todayDate).sort();
  const latestPriorDate = priorDates[priorDates.length - 1];
  if (!latestPriorDate) return [];
  return published.filter((p) => p.date === latestPriorDate);
}

// 商品IDの一致率（0〜1）。URLはアフィリエイトのトラッキングパラメータ等で揺れることがあるため、
// 商品の同一性判定はitemCode（楽天の商品コード）を正とする。
function itemCodeOverlapRatio(codesA, codesB) {
  if (codesA.length === 0) return 0;
  const setB = new Set(codesB);
  const overlap = codesA.filter((code) => setB.has(code)).length;
  return overlap / codesA.length;
}

// タイトルの簡易類似度（文字bi-gramのJaccard係数）。言い回しを変えただけの言い換え記事を
// 補助的に検知する（商品ID一致ほど確実ではないため、しきい値は高めに設定している）。
function titleSimilarity(a, b) {
  const bigrams = (s) => {
    const clean = String(s).replace(/[\s\p{P}\p{S}]/gu, '');
    const set = new Set();
    for (let i = 0; i < clean.length - 1; i++) set.add(clean.slice(i, i + 2));
    return set;
  };
  const setA = bigrams(a);
  const setB = bigrams(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const g of setA) if (setB.has(g)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// 直前の生成分の記事それぞれと比較し、最も似ているものを1件選ぶ。
function findClosestPriorArticle(itemCodes, priorArticles) {
  let best = null;
  for (const prior of priorArticles) {
    const ratio = itemCodeOverlapRatio(itemCodes, prior.itemCodes || []);
    if (!best || ratio > best.ratio) {
      best = { prior, ratio };
    }
  }
  return best;
}

function mockArticle(products) {
  return {
    title: `【mock】今売れているもの${products.length}選`,
    body:
      'これはモックモードで生成したダミー本文です。\n\n' +
      products
        .map((p, i) => `${i + 1}位は${p.name}（¥${p.price.toLocaleString('ja-JP')}）でした。`)
        .join('\n'),
  };
}

// フロントマターはYAMLとして手書きせず、JSON（YAML 1.2の正当なサブセット）を
// そのまま埋め込む。商品名や説明文に含まれる記号（コロン・引用符など）の
// エスケープ漏れによる壊れを避けるための意図的な選択。
function buildMarkdown(frontmatter, body) {
  return `---\n${JSON.stringify(frontmatter, null, 2)}\n---\n\n${body}\n`;
}

async function main() {
  log(`=== RakutenAutoShop generate.mjs 開始 (${new Date().toISOString()}) mock=${MOCK} publish=${DO_PUBLISH} ===`);

  const config = loadJson(CONFIG_PATH, {
    articlesPerDay: 1,
    productsPerArticle: 5,
    publish: { enabled: false, live: false },
  });

  let applicationId = null;
  let accessKey = null;
  let affiliateId = null;
  let siteUrl = null;
  if (!MOCK) {
    const rakutenConfig = loadJson(RAKUTEN_CONFIG_PATH, null);
    if (!rakutenConfig || !rakutenConfig.applicationId || !rakutenConfig.accessKey) {
      log(
        'エラー: rakuten-config.json が見つからないか applicationId/accessKey が未設定です。' +
          'rakuten-config.example.json をコピーして値を設定してください（--mockなら不要）。',
      );
      flushLog();
      process.exitCode = 1;
      return;
    }
    applicationId = rakutenConfig.applicationId;
    accessKey = rakutenConfig.accessKey;
    affiliateId = rakutenConfig.affiliateId;
    siteUrl = rakutenConfig.siteUrl;
  }

  if (!MOCK) {
    try {
      await runClaudeCLI('okのみ1語で返答してください', { timeoutMs: 60 * 1000 });
    } catch (err) {
      log(`エラー: claude CLIを利用できません（ログイン状態を確認してください）: ${err.message}`);
      flushLog();
      process.exitCode = 1;
      return;
    }
  }

  const history = loadJson(HISTORY_PATH, { itemCodes: [] });
  const published = loadJson(PUBLISHED_PATH, []);
  const todayDate = todayStr();
  const priorArticles = getPriorArticles(published, todayDate);

  let rankingItems;
  try {
    rankingItems = MOCK
      ? mockRankingItems()
      : await fetchRankingItems({ applicationId, accessKey, affiliateId, siteUrl });
  } catch (err) {
    log(`エラー: 楽天ランキングの取得に失敗しました: ${err.message}`);
    flushLog();
    process.exitCode = 1;
    return;
  }

  // articlesPerDay×productsPerArticleが取得したランキング件数以上（=ランキング全体を
  // カバーする設定）の場合は「今日のランキングをそのまま出す」ことが目的なので、
  // ここでの選定上は重複除外をしない（上位商品が連日居座るのは当然で、それこそが見せたい
  // 内容のため）。ただしランキングが停滞して前回生成分と事実上同一になるケースへの対策として、
  // 下の記事生成ループで直前の生成分との一致率を検知し、frontmatterにフラグを残す
  // （reports/2026-10-21_楽天買い物ラボ_記事重複調査.md）。
  // 逆にランキングの一部だけを厳選して出す設定のときだけ、直近30日の重複を避ける。
  const totalNeeded = config.articlesPerDay * config.productsPerArticle;
  let fresh;
  if (totalNeeded >= rankingItems.length) {
    fresh = rankingItems;
  } else {
    const usedCodes = new Set(history.itemCodes.map((e) => e.itemCode));
    fresh = rankingItems.filter((it) => !usedCodes.has(it.itemCode));
    if (fresh.length < totalNeeded) {
      log(
        `直近${HISTORY_TRIM_DAYS}日以内に未紹介の商品が${fresh.length}件しかないため、` +
          `既出の商品も含めてランキング上位から補います。`,
      );
      fresh = rankingItems;
    }
  }

  const successes = [];
  const failures = [];

  for (let articleIdx = 0; articleIdx < config.articlesPerDay; articleIdx++) {
    const start = articleIdx * config.productsPerArticle;
    const slice = fresh.slice(start, start + config.productsPerArticle);
    if (slice.length === 0) {
      log(`記事${articleIdx + 1}: 使える商品がもうないためスキップします`);
      continue;
    }
    const products = slice.map((item, i) => normalizeProduct(item, i + 1));

    try {
      const article = MOCK ? mockArticle(products) : parseArticle(await runClaudeCLI(buildPrompt(products)));

      const date = todayStr();
      const idxStr = String(articleIdx + 1).padStart(2, '0');
      const id = `${date}-${idxStr}`;

      // 直前の生成分との重複チェック（商品IDの一致率を主、タイトル類似度を補助とする）。
      const itemCodes = products.map((p) => p.itemCode);
      const closest = findClosestPriorArticle(itemCodes, priorArticles);
      let duplicateCheck;
      let duplicateFlagged = false;
      if (closest) {
        const simRatio = titleSimilarity(article.title, closest.prior.title);
        duplicateFlagged =
          closest.ratio >= DUPLICATE_ITEMCODE_OVERLAP_THRESHOLD ||
          (closest.ratio >= 0.6 && simRatio >= DUPLICATE_TITLE_SIMILARITY_THRESHOLD);
        duplicateCheck = {
          flagged: duplicateFlagged,
          itemCodeOverlapRatio: Math.round(closest.ratio * 100) / 100,
          titleSimilarity: Math.round(simRatio * 100) / 100,
          comparedTo: closest.prior.id,
        };
        if (duplicateFlagged) {
          log(
            `記事${articleIdx + 1} (${id}): 直前の生成分（${closest.prior.id}）と商品の一致率` +
              `${Math.round(closest.ratio * 100)}%・タイトル類似度${Math.round(simRatio * 100)}%のため` +
              `重複の疑いとしてフラグを立てます（内容は生成を継続し、公開前チェックで確認してください）。`,
          );
        }
      }

      const frontmatter = {
        title: article.title,
        pubDate: date,
        imageKeyword: undefined,
        products,
        duplicateCheck,
      };
      // undefinedのキーはJSON.stringifyで自然に消えるのでそのままでよい。
      const markdown = buildMarkdown(frontmatter, article.body);

      mkdirSync(ARTICLES_DIR, { recursive: true });
      const filePath = path.join(ARTICLES_DIR, `${id}.md`);
      writeFileSync(filePath, markdown, 'utf-8');
      log(`記事${articleIdx + 1}: 保存しました -> ${filePath}`);

      for (const p of products) {
        history.itemCodes.push({ itemCode: p.itemCode, date });
      }

      successes.push({ id, title: article.title, products, duplicateFlagged });
    } catch (err) {
      log(`記事${articleIdx + 1}: 生成に失敗しました: ${err.message}`);
      failures.push({ articleIdx, message: err.message });
    }
  }

  history.itemCodes = trimOlderThan(history.itemCodes, HISTORY_TRIM_DAYS);
  saveJson(HISTORY_PATH, history);

  for (const s of successes) {
    published.push({
      date: todayStr(),
      id: s.id,
      title: s.title,
      itemCodes: s.products.map((p) => p.itemCode),
    });
  }
  saveJson(PUBLISHED_PATH, published.slice(-200));

  const duplicateFlaggedIds = successes.filter((s) => s.duplicateFlagged).map((s) => s.id);
  log(
    `生成結果: 成功${successes.length}件 / 失敗${failures.length}件` +
      (duplicateFlaggedIds.length > 0 ? ` / 重複疑いフラグ${duplicateFlaggedIds.length}件（${duplicateFlaggedIds.join(', ')}）` : ''),
  );

  if (DO_PUBLISH && config.publish?.enabled && successes.length > 0) {
    // 重複疑いフラグが1件でも立った生成バッチは、GitHub Pagesに反映される
    // git pushだけは見送り、ローカルコミットまでにとどめる（公開の一歩手前を
    // 承認ポイントにする、という代表の方針に合わせた安全策）。
    // commit自体は実施するため「途中でも最後まで作り上げる」生成フローは止めない。
    const pushAllowed = !!config.publish.live && duplicateFlaggedIds.length === 0;
    if (!!config.publish.live && duplicateFlaggedIds.length > 0) {
      log(
        `重複の疑いがある記事（${duplicateFlaggedIds.join(', ')}）が含まれるため、安全のため今回はpushを見送り、` +
          `ローカルコミットのみ行います。shop-release担当の確認後、問題なければ手動でgit pushしてください。`,
      );
    }
    try {
      const result = await publishToGit({
        cwd: ROOT,
        message: `記事追加: ${successes.map((s) => s.title).join(', ')}`,
        push: pushAllowed,
      });
      log(`git公開: ${result}`);
    } catch (err) {
      log(`エラー: gitへの公開に失敗しました: ${err.message}`);
      failures.push({ articleIdx: -1, message: `publish: ${err.message}` });
    }
  } else if (DO_PUBLISH) {
    log('publish.enabled が false、または成功記事が0件のため公開処理をスキップしました');
  }

  flushLog();
  if (failures.length > 0 && successes.length === 0) {
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { buildPrompt, parseArticle, buildMarkdown };
