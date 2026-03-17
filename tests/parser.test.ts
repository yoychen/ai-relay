import { parse } from '../src/core/parser.js';

describe('parser', () => {
  test('解析單一 UPDATE 區塊', () => {
    const input = `@@@ ACTION: UPDATE
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
</REPLACE>`;

    const result = parse(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      action: 'UPDATE',
      file: 'src/utils/format.ts',
      search: "export function formatName(name: string) {\n  return name.trim();\n}",
      replace: "export function formatName(name: string) {\n  if (!name) return '';\n  return name.trim().toLowerCase();\n}",
    });
  });

  test('解析單一 CREATE 區塊', () => {
    const input = `@@@ ACTION: CREATE
@@@ FILE: src/components/NewButton.tsx
<CONTENT>
import React from 'react';

export const NewButton = () => {
  return <button>Click</button>;
};
</CONTENT>`;

    const result = parse(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      action: 'CREATE',
      file: 'src/components/NewButton.tsx',
      content: "import React from 'react';\n\nexport const NewButton = () => {\n  return <button>Click</button>;\n};",
    });
  });

  test('解析混合多個區塊，順序正確', () => {
    const input = `@@@ ACTION: CREATE
@@@ FILE: src/a.ts
<CONTENT>
const a = 1;
</CONTENT>
@@@ ACTION: UPDATE
@@@ FILE: src/b.ts
<SEARCH>
const b = 1;
</SEARCH>
<REPLACE>
const b = 2;
</REPLACE>
@@@ ACTION: CREATE
@@@ FILE: src/c.ts
<CONTENT>
const c = 3;
</CONTENT>`;

    const result = parse(input);
    expect(result).toHaveLength(3);
    expect(result[0].action).toBe('CREATE');
    expect(result[0].file).toBe('src/a.ts');
    expect(result[1].action).toBe('UPDATE');
    expect(result[1].file).toBe('src/b.ts');
    expect(result[2].action).toBe('CREATE');
    expect(result[2].file).toBe('src/c.ts');
  });

  test('SEARCH 區塊內含 ==== 等特殊字元不影響解析', () => {
    const input = `@@@ ACTION: UPDATE
@@@ FILE: src/test.ts
<SEARCH>
const x = '====';
const y = '<<<< SEARCH';
</SEARCH>
<REPLACE>
const x = '---';
const y = 'replaced';
</REPLACE>`;

    const result = parse(input);
    expect(result).toHaveLength(1);
    const action = result[0];
    expect(action.action).toBe('UPDATE');
    if (action.action === 'UPDATE') {
      expect(action.search).toContain("'===='");
      expect(action.search).toContain("'<<<< SEARCH'");
    }
  });

  test('CONTENT 內含 JSX 標籤不受干擾', () => {
    const input = `@@@ ACTION: CREATE
@@@ FILE: src/Button.tsx
<CONTENT>
const Button = () => <button type="submit">Click</button>;
export default Button;
</CONTENT>`;

    const result = parse(input);
    expect(result).toHaveLength(1);
    const action = result[0];
    expect(action.action).toBe('CREATE');
    if (action.action === 'CREATE') {
      expect(action.content).toContain('<button type="submit">');
      expect(action.content).toContain('</button>');
    }
  });

  test('解析單一 DELETE 區塊', () => {
    const input = `@@@ ACTION: DELETE
@@@ FILE: src/utils/oldHelper.ts`;

    const result = parse(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      action: 'DELETE',
      file: 'src/utils/oldHelper.ts',
    });
  });

  test('DELETE 可與其他動作混合解析', () => {
    const input = `@@@ ACTION: DELETE
@@@ FILE: src/old.ts
@@@ ACTION: CREATE
@@@ FILE: src/new.ts
<CONTENT>
const x = 1;
</CONTENT>`;

    const result = parse(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ action: 'DELETE', file: 'src/old.ts' });
    expect(result[1].action).toBe('CREATE');
    expect(result[1].file).toBe('src/new.ts');
  });

  test('空字串回傳空陣列', () => {
    expect(parse('')).toEqual([]);
  });

  test('缺少 @@@ FILE: 拋出錯誤', () => {
    const input = `@@@ ACTION: CREATE
<CONTENT>
const a = 1;
</CONTENT>`;
    expect(() => parse(input)).toThrow('Missing @@@ FILE:');
  });

  test('UPDATE 缺少 SEARCH/REPLACE 標籤拋出錯誤', () => {
    const input = `@@@ ACTION: UPDATE
@@@ FILE: src/foo.ts
<SEARCH>
some code
</SEARCH>`;
    expect(() => parse(input)).toThrow('Invalid UPDATE block');
  });
});
