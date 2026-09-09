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

  const usedCodes = new Set(history.itemCodes.map((e) => e.itemCode));
  let fresh = rankingItems.filter((it) => !usedCodes.has(it.itemCode));
  if (fresh.length < config.productsPerArticle) {
    log(
      `直近${HISTORY_TRIM_DAYS}日以内に未紹介の商品が${fresh.length}件しかないため、` +
        `既出の商品も含めてランキング上位から補います。`,
    );
    fresh = rankingItems;
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
      const frontmatter = {
        title: article.title,
        pubDate: date,
        imageKeyword: undefined,
        products,
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

      successes.push({ id, title: article.title, products });
    } catch (err) {
      log(`記事${articleIdx + 1}: 生成に失敗しました: ${err.message}`);
      failures.push({ articleIdx, message: err.message });
    }
  }

  history.itemCodes = trimOlderThan(history.itemCodes, HISTORY_TRIM_DAYS);
  saveJson(HISTORY_PATH, history);

  const published = loadJson(PUBLISHED_PATH, []);
  for (const s of successes) {
    published.push({
      date: todayStr(),
      id: s.id,
      title: s.title,
      itemCodes: s.products.map((p) => p.itemCode),
    });
  }
  saveJson(PUBLISHED_PATH, published.slice(-200));

  log(`生成結果: 成功${successes.length}件 / 失敗${failures.length}件`);

  if (DO_PUBLISH && config.publish?.enabled && successes.length > 0) {
    try {
      const result = await publishToGit({
        cwd: ROOT,
        message: `記事追加: ${successes.map((s) => s.title).join(', ')}`,
        push: !!config.publish.live,
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
