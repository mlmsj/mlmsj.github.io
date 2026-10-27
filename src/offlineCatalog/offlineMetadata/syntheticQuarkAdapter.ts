import { convertMetadata, type ConversionResult } from './convertMetadata';

export const SYNTHETIC_QUARK_LIMITS = Object.freeze({ maxCalls: 1, pageSize: 3, timeoutMs: 10_000, responseBytes: 65_536 });
export type SyntheticDirectory = { readonly kind: 'synthetic-non-root'; readonly id: string };
export type SyntheticListRequest = {
  readonly directoryId: string;
  readonly pageSize: 3;
  readonly singlePage: true;
  readonly signal: AbortSignal;
};
/** Trusted, in-memory test fixture only. This marker is not a sandbox or permission. */
export type SyntheticQuarkProvider = {
  readonly mode: 'synthetic-only';
  readonly listDirectChildren: (request: SyntheticListRequest) => Promise<Uint8Array>;
};
type FailureCode = 'INVALID_DIRECTORY' | 'REAL_PROVIDER_BLOCKED' | 'PROVIDER_FAILED' | 'TIMEOUT' | 'RESPONSE_TOO_LARGE' | 'INVALID_RESPONSE' | 'PAGINATION_BLOCKED' | 'TOO_MANY_ITEMS' | 'INVALID_METADATA';
export type SyntheticQuarkResult =
  | { status: 'rejected'; code: FailureCode; summary: 'Synthetic metadata request rejected'; realAccessAllowed: false }
  | (Extract<ConversionResult, { status: 'accepted' }> & { verification: 'synthetic-only'; realAccessAllowed: false });
const failed = (code: FailureCode): SyntheticQuarkResult => ({ status: 'rejected', code, summary: 'Synthetic metadata request rejected', realAccessAllowed: false });

function own(value: unknown, key: string): unknown {
  if (!value || typeof value !== 'object') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && 'value' in descriptor ? descriptor.value : undefined;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Synthetic wire protocol ONLY: canonical JSON.stringify({items, lastPage:true}),
 * optionally surrounded by ASCII JSON whitespace, encoded as strict UTF-8.
 * Canonical framing rejects duplicate JSON keys and ambiguous number/string forms.
 * The entire returned byte array counts, including framing and discarded fields.
 * Never connect this interface to a real service: there is no real transport here.
 */
export async function listSyntheticQuarkMetadata(directory: unknown, provider?: SyntheticQuarkProvider): Promise<SyntheticQuarkResult> {
  const started = performance.now();
  let directoryId: string;
  let list: SyntheticQuarkProvider['listDirectChildren'];
  try {
    const id = own(directory, 'id');
    if (!isRecord(directory) || own(directory, 'kind') !== 'synthetic-non-root' || typeof id !== 'string' || !/^synthetic-dir-[A-Za-z0-9_-]{1,64}$/.test(id) || /^synthetic-dir-(?:0|root)$/i.test(id)) return failed('INVALID_DIRECTORY');
    directoryId = id;
    const candidate = own(provider, 'listDirectChildren');
    if (!isRecord(provider) || own(provider, 'mode') !== 'synthetic-only' || typeof candidate !== 'function') return failed('REAL_PROVIDER_BLOCKED');
    list = candidate as SyntheticQuarkProvider['listDirectChildren'];
  } catch { return failed('INVALID_DIRECTORY'); }

  const abort = new AbortController();
  const deadline = started + SYNTHETIC_QUARK_LIMITS.timeoutMs;
  return new Promise(resolve => {
    let settled = false;
    const finish = (result: SyntheticQuarkResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => {
      finish(failed('TIMEOUT'));
      abort.abort();
    }, Math.max(0, deadline - performance.now()));
    const expired = () => performance.now() >= deadline;
    // Promise scheduling also catches synchronous provider exceptions. One call
    // per invocation, no pagination/retry/search/fallback. An injected function
    // cannot be sandboxed here; AbortSignal cannot force it to stop work.
    Promise.resolve().then(() => {
      if (settled || expired()) { finish(failed('TIMEOUT')); abort.abort(); return undefined; }
      return list(Object.freeze({ directoryId, pageSize: 3, singlePage: true, signal: abort.signal }));
    }).then(bytes => {
      if (settled) return;
      if (expired()) { finish(failed('TIMEOUT')); abort.abort(); return; }
      try {
        if (!(bytes instanceof Uint8Array)) { finish(failed('INVALID_RESPONSE')); return; }
        if (bytes.byteLength > SYNTHETIC_QUARK_LIMITS.responseBytes) { finish(failed('RESPONSE_TOO_LARGE')); return; }
        const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        const envelope: unknown = JSON.parse(text);
        if (!isRecord(envelope)) { finish(failed('INVALID_RESPONSE')); return; }
        if ('nextCursor' in envelope || 'next_query_cursor' in envelope || 'cursor' in envelope || 'hasMore' in envelope || 'has_more' in envelope || envelope.lastPage !== true) { finish(failed('PAGINATION_BLOCKED')); return; }
        if (Object.keys(envelope).length !== 2 || !Object.hasOwn(envelope, 'items') || !Object.hasOwn(envelope, 'lastPage') || text.replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, '') !== JSON.stringify(envelope) || !Array.isArray(envelope.items)) { finish(failed('INVALID_RESPONSE')); return; }
        if (envelope.items.length > SYNTHETIC_QUARK_LIMITS.pageSize) { finish(failed('TOO_MANY_ITEMS')); return; }
        const converted = convertMetadata('quark', envelope.items);
        if (expired()) { finish(failed('TIMEOUT')); abort.abort(); return; }
        if (converted.status !== 'accepted' || converted.rejectedRows.length > 0) { finish(failed('INVALID_METADATA')); return; }
        finish({ ...converted, verification: 'synthetic-only', realAccessAllowed: false });
      } catch { finish(failed(expired() ? 'TIMEOUT' : 'INVALID_RESPONSE')); }
    }, () => {
      if (settled) return;
      finish(failed(expired() ? 'TIMEOUT' : 'PROVIDER_FAILED'));
    });
  });
}
