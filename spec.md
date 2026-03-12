# 📋 終端機 AI 輔助開發工具 (TUI AI Coding Assistant) 執行企畫書

## 1. 專案概述 (Project Overview)

本專案旨在開發一個基於 Node.js 與 TypeScript 的終端機互動介面 (TUI) 工具。
主要解決在**無法直接使用 IDE AI Agent 的環境下**，開發者需要手動與 Web 版 LLM 互動的痛點。

本工具提供兩大核心工作流：

1. **Generate Prompt (打包上下文)**：讀取本地多個原始碼檔案，結合使用者的需求，自動產生符合嚴格格式的 Prompt。支援複製到剪貼簿或儲存至本地檔案兩種輸出方式。
2. **Apply Modifications (解析與套用)**：讀取 LLM 回傳的特定格式文本（從剪貼簿或指定檔案），解析其中的 `CREATE` (建立) 與 `UPDATE` (修改) 動作，並精準自動化套用至本地專案程式碼中。

## 2. 技術選型 (Tech Stack)

- **執行環境**: Node.js (>= 18)
- **語言**: TypeScript
- **TUI 框架**: `ink` (基於 React 架構的 CLI 渲染引擎)
- **UI 元件**: `ink-text-input` (輸入框), `ink-select-input` (選單)
- **剪貼簿控制**: `clipboardy`（非 WSL 環境）；WSL2 環境改用 PowerShell 並明確設定 UTF-8 編碼，避免中文亂碼

## 3. 專案目錄結構

```
/
├── src/
│   ├── index.tsx                  ← CLI 入口
│   ├── templates/
│   │   └── mainPrompt.ts          ← Prompt 模板字串
│   ├── core/
│   │   ├── parser.ts              ← 解析 LLM 輸出格式
│   │   ├── applier.ts             ← 執行 CREATE / UPDATE 操作
│   │   ├── promptGen.ts           ← 讀取檔案 + 組合 Prompt
│   │   └── clipboard.ts           ← WSL2-aware 剪貼簿讀寫
│   └── components/
│       ├── MainMenu.tsx
│       ├── GeneratePrompt.tsx
│       └── ApplyModifications.tsx
├── tests/
│   └── parser.test.ts
├── scripts/
│   └── postbuild.sh               ← 編譯後注入 shebang
├── tsconfig.json                  ← 開發/測試用（含 tests/）
├── tsconfig.build.json            ← 產品 build 用（僅 src/）
└── jest.config.js
```

## 4. 核心功能規格 (Feature Specifications)

### 功能一：Generate Prompt (產生提示詞)

**操作流程**：

1. TUI 介面提示使用者輸入「目標檔案路徑」（多個檔案以逗號分隔，例如 `src/A.ts, src/B.ts`）。
2. TUI 介面提示使用者輸入「本次修改需求/目的」。
3. 系統讀取目標檔案的完整內容，注入 **Prompt Template**。
4. 提示使用者選擇輸出方式：
   - **複製到剪貼簿**：寫入系統剪貼簿，顯示「✅ 已複製到剪貼簿！」
   - **儲存到檔案**：寫入 `prompt_output.md`，顯示完整路徑（適用剪貼簿不可用的環境）

### 功能二：Apply Modifications (套用 LLM 輸出)

**操作流程**：

1. 使用者在 TUI 選擇「套用修改」。
2. 提示使用者選擇 LLM 輸出來源：
   - **從剪貼簿讀取**：自動讀取系統剪貼簿內容
   - **從檔案讀取**：輸入檔案路徑（預設 `prompt_output.md`）
3. 將字串交給 `core/parser.ts` 解析，提取所有**動作區塊 (Action Blocks)**。
4. 將解析結果交給 `core/applier.ts` 依序執行，過程中在 TUI 即時顯示狀態。
5. 顯示執行總結（成功/失敗筆數）。

## 5. 核心 Parser 規格與 LLM 輸出格式定義 (Crucial)

`core/parser.ts` 必須能夠精確解析以下格式。LLM 的輸出由多個以 `@@@ ACTION:` 開頭的區塊組成。

### 動作 1：UPDATE (修改現有檔案)

- **解析規則**：
  - 提取 `@@@ FILE:` 後方的路徑。
  - 提取 `<SEARCH>` 與 `</SEARCH>` 之間的字串作為 `searchString`。
  - 提取 `<REPLACE>` 與 `</REPLACE>` 之間的字串作為 `replaceString`。

- **執行邏輯**：讀取目標檔案，執行 `fileContent.replace(searchString, replaceString)`，若找不到完全匹配的字串，需拋出錯誤（Strict match required）。

### 動作 2：CREATE (建立新檔案)

- **解析規則**：
  - 提取 `@@@ FILE:` 後方的路徑。
  - 提取 `<CONTENT>` 與 `</CONTENT>` 之間的字串作為 `newContent`。

- **執行邏輯**：遞迴建立父資料夾 (`fs.mkdirSync(dir, { recursive: true })`)，並將 `newContent` 寫入檔案。

### 格式設計原則

原始規格使用 `<<<< SEARCH` / `====` / `>>>> REPLACE` 的 diff 風格標記，實作時改用 XML-style tags，原因：

| 問題 | 原格式 | 改進後 |
|------|--------|--------|
| LLM 生成一致性 | `<<<<` 數量易數錯 | XML 標籤語法 LLM 極熟悉 |
| Parser 正則 | 需跳過 markdown fence、`====` 可能出現在程式碼中 | `<SEARCH>([\s\S]*?)<\/SEARCH>` 直接提取 |
| 明確區塊邊界 | 無明確結束標記 | `</REPLACE>` / `</CONTENT>` 即為結束 |

---

## 6. Prompt Template 資產 (Prompt Template Asset)

建置於 `src/templates/mainPrompt.ts`，供功能一使用：

````markdown
# 【背景：相關原始碼】

以下是我目前專案中的相關程式碼檔案。請閱讀這些檔案以建立完整的上下文：

{{FILES_CONTENT}}

---

# 【需求描述】

請根據上述的程式碼，幫我完成以下任務：
{{USER_REQUIREMENT}}

---

# 【輸出格式要求 (嚴格遵守)】

為了讓我的自動化 CLI 工具能精確解析並執行你的修改，請你務必嚴格遵循以下的特定格式來回覆。

請將每一個檔案的操作獨立為一個區塊。每個區塊必須以 `@@@ ACTION: [CREATE | UPDATE]` 開頭，並根據動作類型使用對應的標記。

### 動作類型 1：UPDATE (修改現有檔案)

使用 `<SEARCH>`、`</SEARCH>`、`<REPLACE>`、`</REPLACE>` 標籤來進行精確的字串替換。

- `<SEARCH>` 內的程式碼必須與原始檔**一字不差**（包含縮排、空行），不可使用 `// ...` 省略。
- 必須包含修改處上下 2-3 行的未修改程式碼作為錨點，以確保唯一性。

**格式範例：**
```
@@@ ACTION: UPDATE
@@@ FILE: src/utils/format.ts
<SEARCH>
export function formatName(name: string) {
  return name.trim();
}
</SEARCH>
<REPLACE>
export function formatName(name: string) {
  if (!name) return '';
  return name.trim().toLowerCase();
}
</REPLACE>
```

### 動作類型 2：CREATE (建立新檔案)

不需要 SEARCH 區塊，直接使用 `<CONTENT>`、`</CONTENT>` 包裝完整的檔案內容。

**格式範例：**
```
@@@ ACTION: CREATE
@@@ FILE: src/components/NewButton.tsx
<CONTENT>
import React from 'react';

export const NewButton = () => {
  return <button>Click</button>;
};
</CONTENT>
```
````

## 7. 剪貼簿相容性 (WSL2)

`core/clipboard.ts` 自動偵測 WSL2 環境（讀取 `/proc/version`）：

- **WSL2**：透過 `powershell.exe` 並明確設定 `[Console]::InputEncoding = UTF8`，確保中文正確寫入 Windows 剪貼簿。
- **非 WSL2**：使用 `clipboardy` 標準實作。

## 8. 打包與安裝

```bash
# 編譯（自動注入 shebang）
npm run build

# 本機全域安裝
npm link

# 打包成 .tgz 分發
npm pack

# 解除全域安裝
npm unlink -g code-partner
```

`scripts/postbuild.sh` 負責在 `dist/index.js` 首行注入 `#!/usr/bin/env node`，使其可作為獨立指令執行。
