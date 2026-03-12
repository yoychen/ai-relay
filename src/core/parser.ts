export type UpdateAction = {
  action: 'UPDATE';
  file: string;
  search: string;
  replace: string;
};

export type CreateAction = {
  action: 'CREATE';
  file: string;
  content: string;
};

export type Action = UpdateAction | CreateAction;

export function parse(input: string): Action[] {
  const results: Action[] = [];

  // Split by @@@ ACTION: to get individual blocks
  const blockPattern = /@@@ ACTION:\s*(UPDATE|CREATE)/g;
  const indices: Array<{ index: number; action: 'UPDATE' | 'CREATE' }> = [];

  let match: RegExpExecArray | null;
  while ((match = blockPattern.exec(input)) !== null) {
    indices.push({ index: match.index, action: match[1] as 'UPDATE' | 'CREATE' });
  }

  for (let i = 0; i < indices.length; i++) {
    const start = indices[i].index;
    const end = i + 1 < indices.length ? indices[i + 1].index : input.length;
    const block = input.slice(start, end);
    const actionType = indices[i].action;

    const fileMatch = /@@@ FILE:\s*(.+)/.exec(block);
    if (!fileMatch) {
      throw new Error(`Missing @@@ FILE: in block:\n${block}`);
    }
    const file = fileMatch[1].trim();

    if (actionType === 'UPDATE') {
      const searchMatch = /<SEARCH>\n([\s\S]*?)\n<\/SEARCH>/.exec(block);
      const replaceMatch = /<REPLACE>\n([\s\S]*?)\n<\/REPLACE>/.exec(block);

      if (!searchMatch || !replaceMatch) {
        throw new Error(`Invalid UPDATE block for file: ${file}`);
      }

      results.push({
        action: 'UPDATE',
        file,
        search: searchMatch[1],
        replace: replaceMatch[1],
      });
    } else {
      const contentMatch = /<CONTENT>\n([\s\S]*?)\n<\/CONTENT>/.exec(block);

      if (!contentMatch) {
        throw new Error(`Invalid CREATE block for file: ${file}`);
      }

      results.push({
        action: 'CREATE',
        file,
        content: contentMatch[1],
      });
    }
  }

  return results;
}
