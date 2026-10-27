// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseManualImport, MAX_FILE_BYTES } from './index';
import type { Format } from './types';
const bytes = (s: string) => new TextEncoder().encode(s);
const parse = (s: string, f: Format = 'json', cats?: ReadonlySet<string>) => parseManualImport(bytes(s), f, cats);
const rejected = (s: string, code: string, f: Format = 'json') => expect(parse(s, f)).toMatchObject({ status: 'rejected', code });
const invalid = (value: unknown, code: string) => expect(parse(JSON.stringify([value]))).toMatchObject({ status: 'accepted', invalidCount: 1, rows: [{ status: 'invalid', errors: expect.arrayContaining([expect.objectContaining({ code })]) }] });

describe('strict structures', () => {
  it('normalizes the six fields and explicit category snapshot', () => {
    expect(parse('[{"name":" 示例😀 ","fileType":"pdf","sizeBytes":0,"categoryId":" usable ","sourceLabel":" ","note":null}]', 'json', new Set(['usable']))).toMatchObject({ status: 'accepted', dataClassification: 'sensitive-in-memory', validCount: 1, rows: [{ candidate: { name: '示例😀', fileType: 'pdf', sizeBytes: 0, categoryId: 'usable', sourceLabel: null, note: null } }] });
  });
  it.each(['json', 'csv'] as const)('supports BOM for %s', f => {
    expect(parse('\ufeff' + (f === 'json' ? '[{"name":"a"}]' : 'name\na'), f)).toMatchObject({ status: 'accepted', validCount: 1 });
  });
  it.each(['{}', 'null', '42', '"x"', '[null]', '[1]', '[true]', '[[]]'])('rejects non-object structure %s', s => rejected(s, 'JSON_STRUCTURE'));
  it.each(['[{"name":"a","name":"b"}]', '[{"name":"a","na\\u006de":"b"}]', '[{"note":null,"note":null}]'])('detects duplicate decoded key %s', s => rejected(s, 'DUPLICATE_KEY'));
  it.each(['[{"name":{"a":1}}]', '[{"name":' + '['.repeat(10000) + '0' + ']'.repeat(10000) + '}]'])('rejects nesting without recursion', s => rejected(s, 'JSON_STRUCTURE'));
  it.each(['__proto__', 'constructor', 'prototype', 'path', 'fs_id', 'url', 'access_token', 'cookie', 'password', 'other'])('rejects unknown key %s without leaks', key => {
    const result = parse('[{"name":"PRIVATE_CANARY","' + key + '":"SECRET_CANARY"}]');
    expect(result).toMatchObject({ status: 'rejected', code: 'UNKNOWN_FIELD' });
    expect(JSON.stringify(result)).not.toMatch(/CANARY|stack/);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
  it.each(['[{},]', '[{,}]', '[{"name":"a",}]', '[{"name":"a"}] junk', '[{"name":"\\q"}]', '[{"name":"a","sizeBytes":01}]', '[{"name":"a","sizeBytes":NaN}]', '[{"name":"a","sizeBytes":Infinity}]', '[{"name":"a\nb"}]'])('rejects malformed JSON %s', s => rejected(s, 'JSON_SYNTAX'));
  it('decodes JSON escaped quotes, slashes and unicode', () => expect(parse('[{"name":"\\u793a\\u4f8b","note":"quote \\\" slash \\\\"}]')).toMatchObject({ validCount: 1 }));
  it('supports CSV quote escaping, commas and embedded CRLF/LF', () => {
    expect(parse('name,note\r\n"a,b","say ""hi""\r\nnext\nlast"\r\n', 'csv')).toMatchObject({ validCount: 1, rows: [{ candidate: { name: 'a,b', note: 'say "hi"\r\nnext\nlast' } }] });
  });
  it.each(['name\n"a', 'name\n"a"x', 'name\na"b', 'name\ra'])('rejects bad CSV quotes/endings %s', s => rejected(s, 'CSV_SYNTAX', 'csv'));
  it.each(['name,name\na,b', ',name\na,b', 'note\na', ' name\na', 'name,\na,b'])('rejects CSV headers %s', s => rejected(s, 'CSV_HEADER', 'csv'));
  it('rejects unknown CSV header', () => rejected('name,password\na,SECRET_CANARY', 'UNKNOWN_FIELD', 'csv'));
  it.each(['name,note\na', 'name\na,b', 'name,note\n\na,b'])('rejects mismatched columns %s', s => rejected(s, 'CSV_COLUMNS', 'csv'));
  it('counts interior blank rows, allows one terminating newline', () => expect(parse('name\na\n\nb\n', 'csv')).toMatchObject({ totalRecords: 3, validCount: 2, invalidCount: 1 }));
  it('keeps CSV formula-looking text inert', () => expect(parse('name\n=1+1', 'csv')).toMatchObject({ rows: [{ candidate: { name: '=1+1' } }] }));
  it.each(['[]', 'name\n'])('allows zero-record structure', s => expect(parse(s, s === '[]' ? 'json' : 'csv')).toMatchObject({ totalRecords: 0 }));
});

describe('bounds and encoding', () => {
  it('rejects empty bytes', () => expect(parseManualImport(new Uint8Array(), 'json')).toMatchObject({ code: 'EMPTY_FILE' }));
  it('accepts exact 1 MiB and rejects extra byte before decoding', () => {
    expect(parse('[]' + ' '.repeat(MAX_FILE_BYTES - 2))).toMatchObject({ status: 'accepted' });
    const decode = vi.spyOn(TextDecoder.prototype, 'decode');
    expect(parseManualImport(new Uint8Array(MAX_FILE_BYTES + 1).fill(255), 'json')).toMatchObject({ code: 'FILE_TOO_LARGE' });
    expect(decode).not.toHaveBeenCalled(); decode.mockRestore();
  });
  it.each([[0xc0, 0xaf], [0xe2, 0x82], [0xed, 0xa0, 0x80], [0xff], [0xf4, 0x90, 0x80, 0x80]].map(values => ({ values })))('rejects invalid UTF-8 $values', ({ values }) => expect(parseManualImport(new Uint8Array(values), 'json')).toMatchObject({ code: 'INVALID_UTF8' }));
  it('does not reject a legitimately encoded replacement character', () => expect(parse('[{"name":"�"}]')).toMatchObject({ validCount: 1 }));
  it.each(['\u0000', '\u0001', '\u007f', '\u0085'])('rejects literal controls', c => rejected('name\na' + c, 'CONTROL_CHARACTER', 'csv'));
  it.each(['\\u0000', '\\u007f', '\\ud800', '\\udc00'])('rejects escaped unsafe text %s', c => expect(parse('[{"name":"' + c + '"}]')).toMatchObject({ invalidCount: 1 }));
  it.each(['csv', 'json'] as const)('counts all records, including invalid rows, in %s', f => {
    const input = (n: number) => f === 'json' ? JSON.stringify(Array.from({ length: n }, () => ({ name: '' }))) : 'name\n' + Array.from({ length: n }, () => '""').join('\n');
    expect(parse(input(100), f)).toMatchObject({ totalRecords: 100, invalidCount: 100 });
    rejected(input(101), 'TOO_MANY_RECORDS', f);
  });
  it('enforces explicit format', () => expect(parseManualImport(bytes('[]'), 'xml' as Format)).toMatchObject({ code: 'INVALID_FORMAT' }));
});

describe('field validation and privacy', () => {
  it.each([{}, { name: null }, { name: '' }, { name: ' \t ' }])('requires name', value => invalid(value, 'REQUIRED'));
  it.each([{ name: 1 }, { name: 'a', note: false }, { name: 'a', categoryId: 1 }])('rejects text types', value => invalid(value, 'INVALID_TYPE'));
  it.each([['name', 200], ['sourceLabel', 50], ['note', 500]] as const)('counts Unicode code points for %s', (field, limit) => {
    expect(parse(JSON.stringify([{ name: 'a', [field]: '😀'.repeat(limit) }]))).toMatchObject({ validCount: 1 });
    invalid({ name: 'a', [field]: '😀'.repeat(limit + 1) }, 'TOO_LONG');
  });
  it.each(['PDF', 'exe', 'document'])('rejects fileType %s', value => invalid({ name: 'a', fileType: value }, 'INVALID_FILE_TYPE'));
  it.each(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'other'])('accepts fileType %s', value => expect(parse(JSON.stringify([{ name: 'a', fileType: value }]))).toMatchObject({ validCount: 1 }));
  it.each([-1, 0.1, 9007199254740992, true, '1e3', '12', '', ' '])('rejects JSON size %j', value => invalid({ name: 'a', sizeBytes: value }, 'INVALID_SIZE'));
  it.each([0, Number.MAX_SAFE_INTEGER])('accepts safe size %s', value => expect(parse(JSON.stringify([{ name: 'a', sizeBytes: value }]))).toMatchObject({ validCount: 1 }));
  it('rejects numeric overflow', () => expect(parse('[{"name":"a","sizeBytes":1e999}]')).toMatchObject({ invalidCount: 1 }));
  it.each(['-1', '1e3', '1.5', '+1', 'NaN', 'Infinity', '9007199254740992'])('rejects CSV size %s', v => expect(parse('name,sizeBytes\na,' + v, 'csv')).toMatchObject({ invalidCount: 1 }));
  it('accepts CSV decimal integer and blank optional values', () => expect(parse('name,sizeBytes,note\na, 0012 , \nb,,', 'csv')).toMatchObject({ validCount: 2, rows: [{ candidate: { sizeBytes: 12, note: null } }, { candidate: { sizeBytes: null } }] }));
  it('requires an explicit usable category set', () => {
    invalid({ name: 'a', categoryId: 'usable' }, 'CATEGORY_UNCONFIRMED');
    expect(parse('[{"name":"a","categoryId":"disabled"}]', 'json', new Set(['usable']))).toMatchObject({ invalidCount: 1 });
  });
  it('normalizes optional text consistently', () => expect(parse('[{"name":" a ","fileType":" ","categoryId":"","note":null}]')).toMatchObject({ rows: [{ candidate: { name: 'a', fileType: null, categoryId: null, sourceLabel: null, note: null } }] }));
  it('preserves other valid rows while hiding invalid row values', () => {
    const result = parse('[{"name":"a"},{"name":"PRIVATE_CANARY","fileType":"SECRET_CANARY"}]');
    expect(result).toMatchObject({ validCount: 1, invalidCount: 1 });
    expect(JSON.stringify(result)).not.toContain('CANARY');
  });
  it('does not mutate bytes/categories and is repeatable', () => {
    const input = bytes('[{"name":"a","categoryId":"c"}]'); const original = input.slice(); const cats = new Set(['c']);
    expect(parseManualImport(input, 'json', cats)).toEqual(parseManualImport(input, 'json', cats));
    expect(input).toEqual(original); expect([...cats]).toEqual(['c']);
  });
  it('has no external imports, network, persistence, console or runtime evaluation', () => {
    for (const filename of ['index.ts', 'structure.ts', 'types.ts']) {
      const source = readFileSync(new URL(filename, import.meta.url), 'utf8');
      expect(source).not.toMatch(/\b(fetch|XMLHttpRequest|localStorage|sessionStorage|indexedDB|sendBeacon|console|eval|Function)\b|node:|\bimport\s*\(/);
      for (const match of source.matchAll(/from ['"]([^'"]+)['"]/g)) expect(match[1]).toMatch(/^\.\//);
    }
    const network = vi.fn(() => { throw new Error('forbidden'); }); vi.stubGlobal('fetch', network);
    try { expect(parse('[{"name":"a"}]')).toMatchObject({ validCount: 1 }); expect(network).not.toHaveBeenCalled(); }
    finally { vi.unstubAllGlobals(); }
  });
});
