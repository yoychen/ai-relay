export const MAIN_PROMPT_TEMPLATE = `# 【背景：相關原始碼】

以下是我目前專案中的相關程式碼檔案。請閱讀這些檔案以建立完整的上下文：

{{FILES_CONTENT}}

---

# 【需求描述】

請根據上述的程式碼，幫我完成以下任務：
{{USER_REQUIREMENT}}

---

# 【輸出格式要求 (嚴格遵守)】

為了讓我的自動化 CLI 工具能精確解析並執行你的修改，請你務必嚴格遵循以下的特定格式來回覆。

請將每一個檔案的操作獨立為一個區塊。每個區塊必須以 \`@@@ ACTION: [CREATE | UPDATE]\` 開頭，並根據動作類型使用對應的標記。

### 動作類型 1：UPDATE (修改現有檔案)

使用 \`<SEARCH>\`、\`</SEARCH>\`、\`<REPLACE>\`、\`</REPLACE>\` 標籤來進行精確的字串替換。

- \`<SEARCH>\` 內的程式碼必須與原始檔**一字不差**（包含縮排、空行），不可使用 \`// ...\` 省略。
- 必須包含修改處上下 2-3 行的未修改程式碼作為錨點，以確保唯一性。

**格式範例：**
\`\`\`
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
\`\`\`

### 動作類型 2：CREATE (建立新檔案)

不需要 SEARCH 區塊，直接使用 \`<CONTENT>\`、\`</CONTENT>\` 包裝完整的檔案內容。

**格式範例：**
\`\`\`
@@@ ACTION: CREATE
@@@ FILE: src/components/NewButton.tsx
<CONTENT>
import React from 'react';

export const NewButton = () => {
  return <button>Click</button>;
};
</CONTENT>
\`\`\`
`;
