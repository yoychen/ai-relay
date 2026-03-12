import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import clipboardy from 'clipboardy';

function detectWSL(): boolean {
  try {
    const version = readFileSync('/proc/version', 'utf-8');
    return version.toLowerCase().includes('microsoft');
  } catch {
    return false;
  }
}

const IS_WSL = detectWSL();

export function writeClipboard(text: string): void {
  if (IS_WSL) {
    // 透過 PowerShell 明確指定 UTF-8 輸入編碼，避免中文亂碼
    spawnSync(
      'powershell.exe',
      [
        '-NoProfile', '-NonInteractive', '-Command',
        '[Console]::InputEncoding = [System.Text.Encoding]::UTF8; [Console]::In.ReadToEnd() | Set-Clipboard',
      ],
      { input: text, encoding: 'utf8' }
    );
  } else {
    clipboardy.writeSync(text);
  }
}

export function readClipboard(): string {
  if (IS_WSL) {
    const result = spawnSync(
      'powershell.exe',
      [
        '-NoProfile', '-NonInteractive', '-Command',
        '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-Clipboard',
      ],
      { encoding: 'utf8' }
    );
    return result.stdout.trimEnd();
  } else {
    return clipboardy.readSync();
  }
}
