// 記事ごとの PR 画像（1200×630。SNS のリンク表示・記事の先頭に使う）を作る。
// 記事のタイトルと、上位3商品の楽天の商品画像を組み合わせるだけ（画像生成AIは使わない＝費用はかからない）。
//
//   node pr-image.mjs            … まだ画像のない記事の分だけ作る（public/pr/<記事ID>.png）
//   node pr-image.mjs --publish  … 作ったあと、config.json の publish.live が true なら git commit / push する
//   node pr-image.mjs --all      … すべて作り直す
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { publishToGit } from './publish-git.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const ARTICLES = path.join(ROOT, 'src', 'content', 'articles');
const OUT = path.join(ROOT, 'public', 'pr');
const W = 1200, H = 630;
const ALL = process.argv.includes('--all');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 記事の先頭の JSON（--- と --- の間）を読む
function readArticle(file) {
  const t = fs.readFileSync(file, 'utf8');
  const m = t.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

// タイトルを1行あたりの文字数で折り返す（最大3行）
function wrap(text, perLine = 17, maxLines = 3) {
  const chars = [...text];
  const lines = [];
  for (let i = 0; i < chars.length && lines.length < maxLines; i += perLine) lines.push(chars.slice(i, i + perLine).join(''));
  if (chars.length > perLine * maxLines) lines[maxLines - 1] = [...lines[maxLines - 1]].slice(0, perLine - 1).join('') + '…';
  return lines;
}

async function productImage(url, size) {
  try {
    const big = url.replace(/_ex=\d+x\d+/, `_ex=${size}x${size}`);
    const r = await fetch(big, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    // 白地の角丸の枠に収める
    const img = await sharp(buf).resize(size - 24, size - 24, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
    const frame = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="18" fill="#ffffff"/></svg>`);
    return sharp(frame).composite([{ input: img, top: 12, left: 12 }]).png().toBuffer();
  } catch { return null; }
}

export async function makePrImage(id, data) {
  const lines = wrap(data.title || '楽天ランキング');
  const size = 250, gap = 20, top3 = (data.products || []).slice(0, 3);
  const imgs = (await Promise.all(top3.map(p => productImage(p.imageUrl, size)))).filter(Boolean);
  const startX = W - 60 - imgs.length * size - (imgs.length - 1) * gap;
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bf0000"/><stop offset="1" stop-color="#7a0010"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="28" fill="#fff8f2" opacity="0.08"/>
  <text x="60" y="100" font-family="Yu Gothic UI, Yu Gothic, Meiryo, sans-serif" font-size="30" font-weight="700" fill="#ffd9a0">楽天お買い物ラボ ｜ 今日のランキング</text>
  ${lines.map((l, i) => `<text x="60" y="${190 + i * 66}" font-family="Yu Gothic UI, Yu Gothic, Meiryo, sans-serif" font-size="54" font-weight="700" fill="#ffffff">${esc(l)}</text>`).join('\n  ')}
  ${imgs.map((_, i) => `<text x="${startX + i * (size + gap) + 14}" y="${H - 60 - size - 12}" font-family="Yu Gothic UI, Meiryo, sans-serif" font-size="26" font-weight="700" fill="#ffd9a0">${i + 1}位</text>`).join('\n  ')}
  <text x="${W - 60}" y="${H - 28}" text-anchor="end" font-family="Yu Gothic UI, Meiryo, sans-serif" font-size="20" fill="#ffd9a0">PR ｜ 楽天アフィリエイトを利用しています</text>
</svg>`;
  fs.mkdirSync(OUT, { recursive: true });
  const out = path.join(OUT, `${id}.png`);
  await sharp(Buffer.from(svg))
    .composite(imgs.map((input, i) => ({ input, top: H - 60 - size, left: startX + i * (size + gap) })))
    .png({ compressionLevel: 9 })
    .toFile(out);
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const made = [];
  for (const f of fs.readdirSync(ARTICLES).filter(f => f.endsWith('.md'))) {
    const id = f.replace(/\.md$/, '');
    if (!ALL && fs.existsSync(path.join(OUT, `${id}.png`))) continue;
    const data = readArticle(path.join(ARTICLES, f));
    if (!data) continue;
    try { made.push(path.relative(ROOT, await makePrImage(id, data))); }
    catch (e) { console.error(`PR画像を作れませんでした（${id}）：${e.message}`); }
  }
  console.log(`PR画像：${made.length}件作成${made.length ? '（' + made.join('、') + '）' : ''}`);
  if (made.length && process.argv.includes('--publish')) {
    let live = false;
    try { live = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8')).publish?.live === true; } catch {}
    console.log(await publishToGit({ cwd: ROOT, message: `PR画像を追加（${made.length}件）`, push: live }));
  }
}
