# AI Relay

終端機 AI 輔助開發工具，解決在無法使用 IDE AI Agent 的環境下，需手動與 Web 版 LLM 互動的痛點。

## 安裝方式

### 方法一：全域安裝（本機開發，推薦）

```bash
git clone <repo-url>
cd ai-relay
npm install
npm run build
npm link
```

安裝後可在任意目錄直接執行：

```bash
ai-relay
```

解除安裝：

```bash
npm unlink -g ai-relay
```

---

### 方法二：從 .tgz 檔案安裝（離線分發）

```bash
# 在專案目錄打包
npm run build
npm pack
# 產生 ai-relay-1.0.0.tgz

# 在目標機器安裝
npm install -g ai-relay-1.0.0.tgz
```

---

### 方法三：從 npm 安裝（發布後）

```bash
npm install -g ai-relay
```

---

### 從原始碼直接執行（無需安裝）

```bash
npm install
npm run dev
```

## 功能介紹

工具啟動後會顯示主選單，使用方向鍵選擇功能，Enter 確認，ESC 返回上一層。

---

### 功能一：產生 Prompt (Generate Prompt)

**用途**：將本地原始碼打包成格式化 Prompt，複製到剪貼簿，再貼給 Web 版 LLM（ChatGPT、Claude 等）。

**操作步驟：**

1. 在主選單選擇「產生 Prompt」
2. 輸入目標檔案路徑，多個檔案以逗號分隔：
   ```
   src/utils/format.ts, src/components/Button.tsx
   ```
3. 輸入本次修改需求，例如：
   ```
   幫 formatName 加上空值檢查，並將結果轉為小寫
   ```
4. 選擇輸出方式：
   - **複製到剪貼簿**：直接貼到 LLM 對話框
   - **儲存到檔案**：寫入 `prompt_output.md`，可用編輯器手動開啟複製（適用剪貼簿無法使用的環境）

---

### 功能二：套用修改 (Apply Modifications)

**用途**：將 LLM 回傳的特定格式文本，自動解析並套用到本地檔案。

**操作步驟：**

1. 在主選單選擇「套用修改」
2. 選擇 LLM 輸出來源：
   - **從剪貼簿讀取**：複製 LLM 回覆後直接選此項
   - **從檔案讀取**：輸入檔案路徑（預設 `prompt_output.md`），適用剪貼簿無法使用的環境
3. 工具自動解析動作、依序執行，並即時顯示每步狀態：
   ```
   ✅ [CREATE] src/components/NewButton.tsx
   ✅ [UPDATE] src/utils/format.ts
   ```

---

## LLM 輸出格式

使用功能一產生的 Prompt 會自動要求 LLM 遵守以下格式。

### UPDATE（修改現有檔案）

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

> **注意**：`<SEARCH>` 內容必須與原始檔**一字不差**，包含縮排與空行。

### CREATE（建立新檔案）

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

---

## 典型工作流程

```
1. npm run dev
        ↓
2. 選擇「產生 Prompt」→ 輸入檔案與需求 → 複製成功
        ↓
3. 貼到 Web LLM → 取得回覆 → 複製 LLM 的完整回覆
        ↓
4. 回到工具 → 選擇「套用修改」→ 自動套用到本地檔案
```

---

## 開發指令

```bash
npm run dev    # 啟動 TUI
npm run build  # 編譯 TypeScript
npm test       # 執行單元測試
```
