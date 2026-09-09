// note.comへのPlaywright自動投稿(publish-note.mjs)の代替。
// このプロジェクトの「公開」はgit commit + pushのみで完結する
// （GitHub Pagesがpushをトリガーに自動ビルド・デプロイするため）。

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function git(args, cwd) {
  try {
    const { stdout } = await execFileAsync('git', args, { cwd });
    return stdout.trim();
  } catch (err) {
    throw new Error(`git ${args.join(' ')} に失敗しました: ${err.stderr || err.message}`);
  }
}

// cwd: リポジトリのルート
// message: コミットメッセージ
// push: trueならリモートへpushする。falseならローカルコミットのみ（下書き相当の安全モード）。
export async function publishToGit({ cwd, message, push }) {
  await git(['add', '-A'], cwd);

  const status = await git(['status', '--porcelain'], cwd);
  if (!status) {
    return 'コミット対象の変更がありませんでした（スキップ）';
  }

  await git(['commit', '-m', message], cwd);

  if (!push) {
    return `ローカルコミットのみ実施しました（config.jsonのpublish.liveがfalseのためpushはスキップ）: ${message}`;
  }

  await git(['push'], cwd);
  return `pushまで完了しました: ${message}`;
}
