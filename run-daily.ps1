# Windowsタスクスケジューラから呼び出されるラッパースクリプト。
# 作業フォルダを固定し、node.exeをフルパスで実行することで
# タスクスケジューラ実行時のPATH未設定問題を回避する（NoteAutoPost/run-daily.ps1と同じ方式）。

$ErrorActionPreference = "Continue"
Set-Location -Path $PSScriptRoot

$nodeExe = "C:\Program Files\nodejs\node.exe"
if (-not (Test-Path $nodeExe)) {
  $cmd = Get-Command node -ErrorAction SilentlyContinue
  if ($cmd) { $nodeExe = $cmd.Source }
}

& $nodeExe (Join-Path $PSScriptRoot "generate.mjs") --publish
exit $LASTEXITCODE
