import React, { useState } from 'react';
import { Text, Box, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import fs from 'fs';
import { readClipboard } from '../core/clipboard.js';
import { parse } from '../core/parser.js';
import { applyActions, ApplyResult } from '../core/applier.js';

type Status = 'choose' | 'file-input' | 'reading' | 'applying' | 'done' | 'error';

const DEFAULT_FILE = 'prompt_output.md';

const sourceItems = [
  { label: '從剪貼簿讀取', value: 'clipboard' },
  { label: `從檔案讀取 (預設: ${DEFAULT_FILE})`, value: 'file' },
];

export function ApplyModifications({ onBack }: { onBack: () => void }) {
  const [status, setStatus] = useState<Status>('choose');
  const [fileInput, setFileInput] = useState(DEFAULT_FILE);
  const [results, setResults] = useState<ApplyResult[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useInput((_, key) => {
    if (key.escape) onBack();
  });

  const runApply = (text: string) => {
    try {
      const actions = parse(text);
      setStatus('applying');

      const collected: ApplyResult[] = [];
      applyActions(actions, (result) => {
        collected.push(result);
        setResults([...collected]);
      });

      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  };

  const handleSourceSelect = (item: { value: string }) => {
    if (item.value === 'clipboard') {
      setStatus('reading');
      try {
        const text = readClipboard();
        runApply(text);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : String(err));
        setStatus('error');
      }
    } else {
      setStatus('file-input');
    }
  };

  const handleFileSubmit = (value: string) => {
    const filePath = value.trim() || DEFAULT_FILE;
    setStatus('reading');
    try {
      const text = fs.readFileSync(filePath, 'utf-8');
      runApply(text);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  };

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>套用修改</Text>
      <Text dimColor>（按 ESC 返回主選單）</Text>
      <Text> </Text>

      {status === 'choose' && (
        <Box flexDirection="column">
          <Text>選擇 LLM 輸出來源：</Text>
          <SelectInput items={sourceItems} onSelect={handleSourceSelect} />
        </Box>
      )}

      {status === 'file-input' && (
        <Box flexDirection="column">
          <Text>輸入檔案路徑（直接 Enter 使用預設 <Text color="cyan">{DEFAULT_FILE}</Text>）：</Text>
          <TextInput value={fileInput} onChange={setFileInput} onSubmit={handleFileSubmit} />
        </Box>
      )}

      {status === 'reading' && <Text color="yellow">正在讀取內容...</Text>}

      {(status === 'applying' || status === 'done') && (
        <Box flexDirection="column">
          {results.map((r, i) => (
            <Text key={i}>
              {r.success ? (
                <Text color="green">✅ [{r.action}] {r.file}</Text>
              ) : (
                <Text color="red">❌ [{r.action}] {r.file} — {r.error}</Text>
              )}
            </Text>
          ))}
        </Box>
      )}

      {status === 'done' && (
        <Box flexDirection="column" marginTop={1}>
          <Text>完成：<Text color="green">{successCount} 成功</Text>
            {failCount > 0 && <Text>，<Text color="red">{failCount} 失敗</Text></Text>}
          </Text>
          <Text dimColor>按 ESC 返回主選單</Text>
        </Box>
      )}

      {status === 'error' && (
        <Box flexDirection="column">
          <Text color="red">❌ 錯誤：{errorMsg}</Text>
          <Text dimColor>按 ESC 返回主選單</Text>
        </Box>
      )}
    </Box>
  );
}
