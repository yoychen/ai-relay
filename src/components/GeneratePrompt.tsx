import React, { useState } from 'react';
import { Text, Box, useInput } from 'ink';
import TextInput from 'ink-text-input';
import fs from 'fs';
import path from 'path';
import { writeClipboard } from '../core/clipboard.js';
import { generatePrompt } from '../core/promptGen.js';
import { FilePicker } from './FilePicker.js';

type Step = 'files' | 'requirement' | 'error';

const OUTPUT_FILE = 'relay_prompt.md';

export function GeneratePrompt({ onBack, fileMode }: { onBack: (msg?: string) => void; fileMode: boolean }) {
  const [step, setStep] = useState<Step>('files');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [requirement, setRequirement] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useInput((input, key) => {
    if (step === 'error' && (key.escape || input === 'q' || input === 'Q')) onBack();
  });

  const handleFilesSubmit = (files: string[]) => {
    setSelectedFiles(files);
    setStep('requirement');
  };

  const handleRequirementSubmit = (value: string) => {
    try {
      const generated = generatePrompt(selectedFiles, value);
      if (fileMode) {
        fs.writeFileSync(path.resolve(process.cwd(), OUTPUT_FILE), generated, 'utf-8');
      } else {
        writeClipboard(generated);
      }
      onBack(fileMode ? `Prompt 已寫入 ${OUTPUT_FILE}` : 'Prompt 已複製到剪貼簿');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStep('error');
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>產生 Prompt</Text>
      <Text dimColor>（按 ESC 返回主選單）</Text>
      <Text> </Text>

      {step === 'files' && (
        <FilePicker onSubmit={handleFilesSubmit} onCancel={onBack} />
      )}

      {step === 'requirement' && (
        <Box flexDirection="column">
          <Text>檔案：<Text color="cyan">{selectedFiles.join(', ')}</Text></Text>
          <Text> </Text>
          <Text>輸入本次修改需求／目的：</Text>
          <TextInput value={requirement} onChange={setRequirement} onSubmit={handleRequirementSubmit} />
        </Box>
      )}

      {step === 'error' && (
        <Box flexDirection="column">
          <Text color="red">❌ 發生錯誤：{errorMsg}</Text>
          <Text dimColor>按 ESC / q 返回主選單</Text>
        </Box>
      )}
    </Box>
  );
}
