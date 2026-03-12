import React, { useState } from 'react';
import { Text, Box } from 'ink';
import SelectInput from 'ink-select-input';
import { GeneratePrompt } from './GeneratePrompt.js';
import { ApplyModifications } from './ApplyModifications.js';

type Screen = 'menu' | 'generate' | 'apply';

const items = [
  { label: '1. 產生 Prompt (Generate Prompt)', value: 'generate' },
  { label: '2. 套用修改 (Apply Modifications)', value: 'apply' },
];

export function MainMenu() {
  const [screen, setScreen] = useState<Screen>('menu');

  if (screen === 'generate') {
    return <GeneratePrompt onBack={() => setScreen('menu')} />;
  }

  if (screen === 'apply') {
    return <ApplyModifications onBack={() => setScreen('menu')} />;
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Code Partner - TUI AI Coding Assistant</Text>
      <Text> </Text>
      <Text>請選擇操作：</Text>
      <SelectInput
        items={items}
        onSelect={(item) => setScreen(item.value as Screen)}
      />
    </Box>
  );
}
