# 📋 終端機 AI 輔助開發工具 (TUI AI Coding Assistant) 執行企畫書

## 1. 專案概述 (Project Overview)

本專案旨在開發一個基於 Node.js 與 TypeScript 的終端機互動介面 (TUI) 工具。
主要解決在**無法直接使用 IDE AI Agent 的環境下**，開發者需要手動與 Web 版 LLM 互動的痛點。

本工具提供兩大核心工作流：

1. **Generate Prompt (打包上下文)**：讀取本地多個原始碼檔案，結合使用者的需求，自動產生符合嚴格格式的 Prompt，並複製到剪貼簿，以便開發者貼給 Web 版 LLM。
2. **Apply Modifications (解析與套用)**：讀取 LLM 回傳的特定格式文本（從剪貼簿或輸入），解析其中的 `CREATE` (建立) 與 `UPDATE` (修改) 動作，並精準自動化套用至本地專案程式碼中。

## 2. 技術選型 (Tech Stack)

- **執行環境**: Node.js (>= 18)
- **語言**: TypeScript
- **TUI 框架**: `ink` (基於 React 架構的 CLI 渲染引擎)
- **UI 元件**: `ink-text-input` (輸入框), `ink-select-input` (選單)
- **CLI 參數解析**: `commander` 或 `cac`
- **剪貼簿控制**: `clipboardy` (用於讀寫剪貼簿)
- **樣式與排版**: `chalk` (色彩)

## 4. 核心功能規格 (Feature Specifications)

### 功能一：Generate Prompt (產生提示詞)

- **操作流程**：

1. TUI 介面提示使用者輸入「目標檔案路徑」（需支援多個檔案，例如輸入 `src/A.ts, src/B.ts`）。
2. TUI 介面提示使用者輸入「本次修改需求/目的」。
3. 系統讀取目標檔案的完整內容。
4. 將檔案內容與需求注入預設的 **[Prompt Template]** 中。
5. 將最終字串寫入系統剪貼簿，並在 TUI 顯示「✅ 複製成功」。

### 功能二：Apply Modifications (套用 LLM 輸出)

- **操作流程**：

1. 使用者在 TUI 選擇「套用修改」。
2. 系統自動從剪貼簿讀取 LLM 的回覆內容（或提供一個暫存檔讓使用者貼上）。
3. 將字串交給 `core/parser.ts` 解析，提取出所有的**動作區塊 (Action Blocks)**。
4. 將解析結果交給 `core/applier.ts` 依序執行檔案寫入或字串替換。
5. 過程中需在 TUI 即時顯示執行狀態（例如：`[CREATE] src/new.ts ... Done`）。

## 5. 核心 Parser 規格與 LLM 輸出格式定義 (Crucial)

`core/parser.ts` 必須能夠精確解析以下格式。LLM 的輸出會由多個以 `@@@ ACTION:` 開頭的區塊組成。

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

- **執行邏輯**：檢查目標檔案是否存在，若無，則遞迴建立父資料夾 (`fs.mkdirSync(dir, { recursive: true })`)，並將 `newContent` 寫入檔案。

---

## 6. Prompt Template 資產 (Prompt Template Asset)

請將以下內容建置於 `src/templates/mainPrompt.ts` 中，供功能一使用：

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

_(備註給 Agent：`{{FILES_CONTENT}}` 與 `{{USER_REQUIREMENT}}` 為字串替換的佔位符)_

## 7. 實作步驟指引 (Implementation Steps for Agent)

1. **初始化專案**：設定 `package.json`、`tsconfig.json`，安裝上述提到的相依套件。
2. **實作 Parser (`core/parser.ts`)**：優先實作字串解析邏輯，並撰寫簡單的單元測試確保 `UPDATE` 與 `CREATE` 區塊能被正確解析為陣列物件：`Array<{ action: 'UPDATE' | 'CREATE', file: string, search?: string, replace?: string, content?: string }>`。
3. **實作 Applier (`core/applier.ts`)**：實作讀寫檔案與 `String.replace` 邏輯。
4. **實作 PromptGen (`core/promptGen.ts`)**：實作檔案讀取與 Template 組合邏輯。
5. **整合 TUI 介面**：使用 Ink 建立選單介面，將上述邏輯與 UI 綁定。
