import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import fg from 'fast-glob';
import Fuse from 'fuse.js';

const VISIBLE_ROWS = 12;

interface FilePickerProps {
  onSubmit: (files: string[]) => void;
  onCancel: () => void;
}

export function FilePicker({ onSubmit, onCancel }: FilePickerProps) {
  const [allFiles, setAllFiles] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fg('**/*', {
      cwd: process.cwd(),
      ignore: ['node_modules/**', '.git/**', 'dist/**'],
      onlyFiles: true,
      dot: false,
    }).then((files) => {
      setAllFiles(files.sort());
      setLoading(false);
    });
  }, []);

  const fuse = useMemo(
    () => new Fuse(allFiles.map((f) => ({ path: f })), { keys: ['path'], threshold: 0.4 }),
    [allFiles],
  );

  const filteredFiles = useMemo(
    () => (query ? fuse.search(query).map((r) => r.item.path) : allFiles),
    [query, fuse, allFiles],
  );

  // Reset cursor when search query changes
  useEffect(() => {
    setCursor(0);
  }, [query]);

  useInput((_input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.tab) {
      if (selected.length > 0) onSubmit(selected);
      return;
    }
    if (key.upArrow) {
      setCursor((c) => Math.max(0, c - 1));
      return;
    }
    if (key.downArrow) {
      setCursor((c) => Math.min(filteredFiles.length - 1, c + 1));
      return;
    }
    if (key.return) {
      const file = filteredFiles[cursor];
      if (file) {
        setSelected((prev) =>
          prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file],
        );
        setQuery('');
      }
    }
  });

  const visibleStart = Math.max(
    0,
    Math.min(cursor - Math.floor(VISIBLE_ROWS / 2), filteredFiles.length - VISIBLE_ROWS),
  );
  const visibleFiles = filteredFiles.slice(visibleStart, visibleStart + VISIBLE_ROWS);

  if (loading) {
    return (
      <Box>
        <Text dimColor>掃描檔案中...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box>
        <Text>搜尋：</Text>
        <TextInput value={query} onChange={setQuery} onSubmit={() => {}} focus={true} />
      </Box>
      <Text dimColor>{'─'.repeat(50)}</Text>

      {filteredFiles.length === 0 ? (
        <Text dimColor>（無符合檔案）</Text>
      ) : (
        visibleFiles.map((file, i) => {
          const actualIndex = visibleStart + i;
          const isCursor = actualIndex === cursor;
          const isSelected = selected.includes(file);
          return (
            <Box key={file}>
              <Text color={isCursor ? 'cyan' : undefined} bold={isCursor}>
                {isCursor ? '▶ ' : '  '}
                {isSelected ? '[x] ' : '[ ] '}
                {file}
              </Text>
            </Box>
          );
        })
      )}

      <Text dimColor>{'─'.repeat(50)}</Text>

      {selected.length > 0 && (
        <Box flexDirection="column">
          <Text dimColor>已選取：</Text>
          {selected.map((f) => (
            <Text key={f} color="green">
              {'  '}
              {f}
            </Text>
          ))}
          <Text> </Text>
        </Box>
      )}

      <Text dimColor>↑↓ 導航 │ Enter 選取／取消 │ Tab 確認送出 │ ESC 取消</Text>
    </Box>
  );
}
