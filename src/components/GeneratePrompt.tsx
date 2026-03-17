import React, { useState } from 'react';
import { Text, Box, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import fs from 'fs';
import path from 'path';
import { writeClipboard } from '../core/clipboard.js';
import { generatePrompt } from '../core/promptGen.js';
import { FilePicker } from './FilePicker.js';

type Step = 'files' | 'requirement' | 'choose' | 'error';

const OUTPUT_FILE = 'prompt_output.md';

const actionItems = [
  { label: '複製到剪貼簿', value: 'clipboard' },
  { label: `儲存到檔案 (${OUTPUT_FILE})`, value: 'file' },
];

export function GeneratePrompt({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>('files');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [requirement, setRequirement] = useState('');
  const [prompt, setPrompt] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useInput((input, key) => {
    if (step === 'error' && (key.escape || input === 'q' || input === 'Q')) onBack();
  });

  const handleFilesSubmit = (files: string[]) => {
    setSelectedFiles(files);
    setStep('requirement');
  };

  const handleRequirementSubmit = (value: string) => {
    setRequirement(value);
    try {
      const generated = generatePrompt(selectedFiles, value);
      setPrompt(generated);
      setStep('choose');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStep('error');
    }
  };

  const handleActionSelect = (item: { value: string }) => {
    try {
      if (item.value === 'clipboard') {
        writeClipboard(prompt);
      } else {
        const outputPath = path.resolve(process.cwd(), OUTPUT_FILE);
        fs.writeFileSync(outputPath, prompt, 'utf-8');
      }
      onBack();
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

      {step === 'choose' && (
        <Box flexDirection="column">
          <Text>Prompt 已產生，請選擇輸出方式：</Text>
          <SelectInput items={actionItems} onSelect={handleActionSelect} />
        </Box>
      )}

      {step === 'error' && (
        <Box flexDirection="column">
          <Text color="red">❌ 發生錯誤：{errorMsg}</Text>
          <Text dimColor>按 ESC 返回主選單</Text>
        </Box>
      )}
    </Box>
  );
}
