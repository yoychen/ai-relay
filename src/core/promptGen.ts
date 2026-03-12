import fs from 'fs';
import { MAIN_PROMPT_TEMPLATE } from '../templates/mainPrompt.js';

export function generatePrompt(filePaths: string[], requirement: string): string {
  const filesContent = filePaths
    .map((filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const ext = filePath.split('.').pop() ?? '';
      return `### 檔案：${filePath}\n\`\`\`${ext}\n${content}\n\`\`\``;
    })
    .join('\n\n');

  return MAIN_PROMPT_TEMPLATE
    .replace('{{FILES_CONTENT}}', filesContent)
    .replace('{{USER_REQUIREMENT}}', requirement);
}
