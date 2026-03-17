import fs from 'fs';
import path from 'path';
import { Action } from './parser.js';

export type ApplyResult = {
  action: 'UPDATE' | 'CREATE' | 'DELETE';
  file: string;
  success: boolean;
  error?: string;
};

export function applyActions(
  actions: Action[],
  onProgress: (result: ApplyResult) => void
): void {
  for (const action of actions) {
    try {
      if (action.action === 'UPDATE') {
        const content = fs.readFileSync(action.file, 'utf-8');
        if (!content.includes(action.search)) {
          throw new Error(`Search string not found in ${action.file} (strict match required)`);
        }
        const updated = content.replace(action.search, action.replace);
        fs.writeFileSync(action.file, updated, 'utf-8');
        onProgress({ action: 'UPDATE', file: action.file, success: true });
      } else if (action.action === 'CREATE') {
        if (fs.existsSync(action.file)) {
          throw new Error(`File already exists: ${action.file}`);
        }
        const dir = path.dirname(action.file);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(action.file, action.content, 'utf-8');
        onProgress({ action: 'CREATE', file: action.file, success: true });
      } else {
        if (!fs.existsSync(action.file)) {
          throw new Error(`File not found: ${action.file}`);
        }
        fs.unlinkSync(action.file);
        onProgress({ action: 'DELETE', file: action.file, success: true });
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      onProgress({ action: action.action, file: action.file, success: false, error });
    }
  }
}
