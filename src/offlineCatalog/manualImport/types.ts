export const FIELDS = ['name', 'fileType', 'sizeBytes', 'categoryId', 'sourceLabel', 'note'] as const;
export type Field = typeof FIELDS[number];
export type Format = 'csv' | 'json';
export type Candidate = { name: string; fileType: string | null; sizeBytes: number | null; categoryId: string | null; sourceLabel: string | null; note: string | null };
export type BatchCode = 'EMPTY_FILE' | 'FILE_TOO_LARGE' | 'INVALID_UTF8' | 'CONTROL_CHARACTER' | 'INVALID_FORMAT' | 'JSON_SYNTAX' | 'JSON_STRUCTURE' | 'DUPLICATE_KEY' | 'UNKNOWN_FIELD' | 'CSV_SYNTAX' | 'CSV_HEADER' | 'CSV_COLUMNS' | 'TOO_MANY_RECORDS';
export type RowCode = 'REQUIRED' | 'INVALID_TYPE' | 'TOO_LONG' | 'INVALID_FILE_TYPE' | 'INVALID_SIZE' | 'CATEGORY_UNCONFIRMED' | 'INVALID_CATEGORY' | 'INVALID_TEXT';
export type Issue = { code: RowCode; field: Field; index: number };
export type ImportResult =
  | { status: 'rejected'; code: BatchCode; summary: 'Import rejected'; }
  | { status: 'accepted'; dataClassification: 'sensitive-in-memory'; totalRecords: number; validCount: number; invalidCount: number; rows: readonly ({ index: number; status: 'valid'; candidate: Candidate } | { index: number; status: 'invalid'; errors: readonly Issue[] })[] };
