import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

// NoteAutoPost の learn.mjs と同じ形の小さな読み書きヘルパー。
// 壊れたJSON・未作成ファイルはどちらも「まだ何もない」として扱う。
export function loadJson(path, fallback) {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return fallback;
  }
}

export function saveJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

// ローカル日付でYYYY-MM-DDを返す（UTC変換によるJST日付ズレを避ける）。
export function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 指定日数より古いエントリを取り除く（historyの肥大化防止）。
export function trimOlderThan(entries, days, dateField = 'date') {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return entries.filter((e) => new Date(e[dateField]).getTime() >= cutoff);
}
