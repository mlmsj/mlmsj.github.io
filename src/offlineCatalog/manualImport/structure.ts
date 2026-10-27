import { FIELDS, type BatchCode } from './types';

export class ParseFailure extends Error {
  readonly code: BatchCode;
  constructor(code: BatchCode) { super(code); this.code = code; }
}
export const fail = (code: BatchCode): never => { throw new ParseFailure(code); };
export type RawRecord = Partial<Record<typeof FIELDS[number], unknown>>;
const allowed = (key: string) => (FIELDS as readonly string[]).includes(key);

// Deliberately shallow JSON grammar: array of objects containing scalar values.
// Keys are decoded before duplicate/allowlist checks; no attacker keys are assigned.
export function parseJson(text: string): RawRecord[] {
  let p = 0;
  const ws = () => { while (/[\x20\t\r\n]/.test(text[p] ?? '') && p < text.length) p++; };
  const take = (c: string) => { ws(); if (text[p++] !== c) fail('JSON_SYNTAX'); };
  const string = (): string => {
    ws(); const start = p; if (text[p++] !== '"') return fail('JSON_SYNTAX');
    while (p < text.length) {
      const c = text[p++];
      if (c === '"') {
        try { return JSON.parse(text.slice(start, p)) as string; } catch { return fail('JSON_SYNTAX'); }
      }
      if (c === '\\') { p++; }
      else if (c.charCodeAt(0) < 32) fail('JSON_SYNTAX');
    }
    return fail('JSON_SYNTAX');
  };
  const scalar = (): unknown => {
    ws(); if (text[p] === '"') return string();
    if (text[p] === '{' || text[p] === '[') return fail('JSON_STRUCTURE');
    for (const [word, value] of [['null', null], ['true', true], ['false', false]] as const) {
      if (text.startsWith(word, p)) { p += word.length; return value; }
    }
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(p));
    if (!match) return fail('JSON_SYNTAX');
    p += match[0].length; return Number(match[0]);
  };
  ws(); if (text[p] !== '[') return fail('JSON_STRUCTURE'); take('[');
  const rows: RawRecord[] = []; ws();
  if (text[p] !== ']') while (true) {
    if (rows.length >= 100) fail('TOO_MANY_RECORDS');
    ws(); if (text[p] === ']' || p === text.length) fail('JSON_SYNTAX');
    if (text[p] !== '{') fail('JSON_STRUCTURE'); take('{');
    const row: RawRecord = Object.create(null) as RawRecord;
    const keys = new Set<string>(); ws();
    if (text[p] !== '}') while (true) {
      const key = string();
      if (keys.has(key)) fail('DUPLICATE_KEY');
      keys.add(key); if (!allowed(key)) fail('UNKNOWN_FIELD');
      take(':'); row[key as keyof RawRecord] = scalar(); ws();
      if (text[p] !== ',') break; take(',');
    }
    take('}'); rows.push(row); ws();
    if (text[p] !== ',') break; take(',');
  }
  take(']'); ws(); if (p !== text.length) fail('JSON_SYNTAX');
  return rows;
}

export function parseCsv(text: string): RawRecord[] {
  let p = 0;
  let header: string[] | undefined;
  const rows: RawRecord[] = [];
  while (p < text.length) {
    if (header && rows.length >= 100) fail('TOO_MANY_RECORDS');
    const cells: string[] = [];
    while (true) {
      if (cells.length >= FIELDS.length) fail(header ? 'CSV_COLUMNS' : 'CSV_HEADER');
      let value = '';
      if (text[p] === '"') {
        p++; let closed = false;
        while (p < text.length) {
          if (text[p] === '"') {
            p++; if (text[p] === '"') { value += '"'; p++; } else { closed = true; break; }
          } else value += text[p++];
        }
        if (!closed) fail('CSV_SYNTAX');
      } else {
        const start = p;
        while (p < text.length && ![',', '\r', '\n'].includes(text[p])) {
          if (text[p] === '"') fail('CSV_SYNTAX'); p++;
        }
        value = text.slice(start, p);
      }
      cells.push(value);
      if (text[p] === ',') { p++; continue; }
      if (p === text.length) break;
      if (text[p] === '\n') { p++; break; }
      if (text[p] === '\r' && text[p + 1] === '\n') { p += 2; break; }
      fail('CSV_SYNTAX');
    }
    if (!header) {
      header = cells;
      if (!header.includes('name') || new Set(header).size !== header.length || header.some(k => !k)) fail('CSV_HEADER');
      if (header.some(k => !allowed(k))) fail('UNKNOWN_FIELD');
    } else {
      if (cells.length !== header.length) fail('CSV_COLUMNS');
      const row: RawRecord = Object.create(null) as RawRecord;
      header.forEach((key, i) => { row[key as keyof RawRecord] = cells[i]; }); rows.push(row);
    }
  }
  return rows;
}
