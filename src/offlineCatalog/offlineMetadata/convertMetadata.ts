import { MAX_FILE_BYTES, MAX_RECORDS, parseManualImport } from '../manualImport/index';

/** Metadata only: no service, file, UI, persistence or publication entry point. */
export type MetadataSource = 'quark' | 'baidu-synthetic';
export type RejectionCode = 'INVALID_RECORD' | 'UNKNOWN_KIND' | 'INVALID_NAME' | 'SENSITIVE_NAME' | 'INVALID_SIZE';
export type ConversionResult =
  | { status: 'rejected'; code: 'INVALID_SOURCE' | 'INVALID_INPUT' | 'TOO_MANY_RECORDS' | 'INVALID_BUDGET' | 'OUTPUT_TOO_LARGE' | 'OUTPUT_CONTRACT'; summary: 'Conversion rejected' }
  | { status: 'accepted'; dataClassification: 'sensitive-in-memory'; schemaEvidence: 'quark-documented' | 'baidu-synthetic-assumption'; jsonText: string; byteLength: number; inputCount: number; exportedCount: number; directoryCount: number; rejectedRows: readonly { index: number; code: RejectionCode }[] };

const types = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt']);
// Conservative screening, not a general personal-data detector. Input must already
// be synthetic/minimized. Names carrying paths, URLs or credential markers fail.
const sensitiveName = /[/\\]|[a-z][a-z\d+.-]*:|(?:token|cookie|password|passcode|secret|authorization|access[_ -]?key|提取码|密码|令牌|凭证)\s*[:=]|(?:fid|fs_id)\s*[:=]/i;
// Intentional rejection of prohibited control characters, matching import policy.
// eslint-disable-next-line no-control-regex
const invalidText = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u;
const reject = (code: Extract<ConversionResult, { status: 'rejected' }>['code']): ConversionResult => ({ status: 'rejected', code, summary: 'Conversion rejected' });

function plain(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function field(record: Record<string, unknown>, key: string): { ok: true; value: unknown } | { ok: false } {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  if (!descriptor) return { ok: true, value: undefined };
  return 'value' in descriptor ? { ok: true, value: descriptor.value } : { ok: false };
}

/**
 * quark: filename/file_type ('1' file, '0' directory)/size.
 * baidu-synthetic: server_filename/isdir (0 file, 1 directory)/size;
 * this is an explicit synthetic assumption, NOT a verified MCP response schema.
 * maxOutputBytes may only narrow the fixed 1 MiB budget. All input rows count.
 * Results contain only anonymous rejection codes; no raw objects are retained.
 */
export function convertMetadata(source: MetadataSource, input: unknown, maxOutputBytes = MAX_FILE_BYTES): ConversionResult {
  if (source !== 'quark' && source !== 'baidu-synthetic') return reject('INVALID_SOURCE');
  if (!Number.isSafeInteger(maxOutputBytes) || maxOutputBytes < 2 || maxOutputBytes > MAX_FILE_BYTES) return reject('INVALID_BUDGET');
  try {
    if (!Array.isArray(input)) return reject('INVALID_INPUT');
    if (input.length > MAX_RECORDS) return reject('TOO_MANY_RECORDS');
    const rejectedRows: { index: number; code: RejectionCode }[] = [];
    const candidates: { name: string; fileType: string; sizeBytes: number | null; categoryId: null; sourceLabel: string; note: null }[] = [];
    let directoryCount = 0;
    for (let index = 0; index < input.length; index++) {
      const entry = Object.getOwnPropertyDescriptor(input, String(index));
      if (!entry || !('value' in entry) || !plain(entry.value)) { rejectedRows.push({ index, code: 'INVALID_RECORD' }); continue; }
      const record: Record<string, unknown> = entry.value;
      const kind = field(record, source === 'quark' ? 'file_type' : 'isdir');
      if (!kind.ok) { rejectedRows.push({ index, code: 'INVALID_RECORD' }); continue; }
      if (kind.value === (source === 'quark' ? '0' : 1)) { directoryCount++; continue; }
      if (kind.value !== (source === 'quark' ? '1' : 0)) { rejectedRows.push({ index, code: 'UNKNOWN_KIND' }); continue; }
      const nameField = field(record, source === 'quark' ? 'filename' : 'server_filename');
      const sizeField = field(record, 'size');
      if (!nameField.ok || !sizeField.ok) { rejectedRows.push({ index, code: 'INVALID_RECORD' }); continue; }
      if (typeof nameField.value !== 'string' || invalidText.test(nameField.value)) { rejectedRows.push({ index, code: 'INVALID_NAME' }); continue; }
      const name = nameField.value.trim();
      if (!name || [...name].length > 200) { rejectedRows.push({ index, code: 'INVALID_NAME' }); continue; }
      if (sensitiveName.test(name)) { rejectedRows.push({ index, code: 'SENSITIVE_NAME' }); continue; }
      const size = sizeField.value;
      if (size != null && (typeof size !== 'number' || !Number.isSafeInteger(size) || size < 0)) { rejectedRows.push({ index, code: 'INVALID_SIZE' }); continue; }
      const dot = name.lastIndexOf('.');
      const extension = dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
      candidates.push({ name, fileType: types.has(extension) ? extension : 'other', sizeBytes: size == null ? null : size as number, categoryId: null, sourceLabel: source === 'quark' ? '夸克网盘' : '百度网盘', note: null });
    }
    const jsonText = JSON.stringify(candidates).replace(/[<>&\u2028\u2029]/g, value => `\\u${value.charCodeAt(0).toString(16).padStart(4, '0')}`);
    const bytes = new TextEncoder().encode(jsonText);
    if (bytes.byteLength > maxOutputBytes) return reject('OUTPUT_TOO_LARGE');
    const checked = parseManualImport(bytes, 'json');
    if (checked.status !== 'accepted' || checked.invalidCount !== 0 || checked.totalRecords !== candidates.length) return reject('OUTPUT_CONTRACT');
    return { status: 'accepted', dataClassification: 'sensitive-in-memory', schemaEvidence: source === 'quark' ? 'quark-documented' : 'baidu-synthetic-assumption', jsonText, byteLength: bytes.byteLength, inputCount: input.length, exportedCount: candidates.length, directoryCount, rejectedRows };
  } catch { return reject('INVALID_INPUT'); }
}
