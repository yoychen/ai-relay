import React, { useState } from 'react';
import { Text, Box, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import fs from 'fs';
import path from 'path';
import { writeClipboard } from '../core/clipboard.js';
import { generatePrompt } from '../core/promptGen.js';

type Step = 'files' | 'requirement' | 'choose' | 'done' | 'error';

const OUTPUT_FILE = 'prompt_output.md';

const actionItems = [
  { label: '複製到剪貼簿', value: 'clipboard' },
  { label: `儲存到檔案 (${OUTPUT_FILE})`, value: 'file' },
];

export function GeneratePrompt({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>('files');
  const [filesInput, setFilesInput] = useState('');
  const [requirement, setRequirement] = useState('');
  const [prompt, setPrompt] = useState('');
  const [doneMsg, setDoneMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useInput((_, key) => {
    if (key.escape) onBack();
  });

  const handleFilesSubmit = (value: string) => {
    setFilesInput(value);
    setStep('requirement');
  };

  const handleRequirementSubmit = (value: string) => {
    setRequirement(value);
    const filePaths = filesInput.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      const generated = generatePrompt(filePaths, value);
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
        setDoneMsg('✅ 已複製到剪貼簿！');
      } else {
        const outputPath = path.resolve(process.cwd(), OUTPUT_FILE);
        fs.writeFileSync(outputPath, prompt, 'utf-8');
        setDoneMsg(`✅ 已儲存到 ${outputPath}`);
      }
      setStep('done');
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
        <Box flexDirection="column">
          <Text>輸入目標檔案路徑（多個檔案以逗號分隔）：</Text>
          <TextInput value={filesInput} onChange={setFilesInput} onSubmit={handleFilesSubmit} />
        </Box>
      )}

      {step === 'requirement' && (
        <Box flexDirection="column">
          <Text>檔案：<Text color="cyan">{filesInput}</Text></Text>
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

      {step === 'done' && (
        <Box flexDirection="column">
          <Text color="green">{doneMsg}</Text>
          <Text dimColor>按 ESC 返回主選單</Text>
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
