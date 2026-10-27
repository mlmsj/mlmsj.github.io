# R13-D-2B-3A offline safety model

This module is isolated from the site and external MCP. It has no HTTP, filesystem,
credential, logging, retry, search or recursive listing implementation. It is not
an applied repair to the running Python MCP. `simulateRead` accepts only an
explicitly injected fake transport for synthetic tests; never attach a live client.

## Interfaces and boundaries

- `createHttpPolicy`: immutable chain/hostname verification, no TLS downgrade,
  no redirects, no inherited environment proxy, no body/debug logging. Custom CA
  requires a separate approval flag; this models approval, not actual CA trust.
- `anonymousError`: returns only a fixed code, never inspects the exception.
- `evaluateRedirect`: denies every redirect, including same-host and HTTP downgrade.
- `authorizeDirectory`: exact canonical NFC path whitelist; rejects root, missing
  values, dot segments, repeated/trailing slash, percent encoding, backslash,
  controls, query and fragment. No decoding, prefix match or directory discovery.
- `gateNextPage`: requires independently verified server item bound, page numbering
  and end protocol. Checks remaining item/page budget before a fake request.
- `summarizeRead`: distinguishes requested pages, fetched items, processed items
  and known end signal. Unknown end or processing truncation stays partial.
- `simulateRead`: one fake call only, no automatic pagination/retry; strips raw
  data and checks actual fake response counts against asserted limits.

`CURRENT_BAIDU_EVIDENCE` intentionally blocks the existing wrapper. Evidence flags
are test inputs, not proof, authorization or runtime attestation. The future real
boundary must validate actual scope, permissions, schema and provider errors, run
the existing adapters/validateSnapshot internally, and emit only aggregate metrics.
Counts alone do not validate a snapshot or authorize `missing_candidate`.

## Static external evidence (not repaired)

Reference: external `combined_server.py`, reviewed without importing/executing it.

| Area | Evidence | Remaining unknown |
| --- | --- | --- |
| TLS | `_get` passes `verify=False` | Real trust chain / approved proxy CA |
| Token | Added to query; HTTP errors directly raised | Endpoint/proxy/debug retention |
| Redirect | No explicit redirect policy | Actual redirect response / token propagation |
| Proxy | No explicit trust_env/proxy policy | Actual environment and proxy credentials (not read) |
| Scope | `directory='/'`, directly forwarded | Real directory authorization |
| Pagination | Optional page; no item-limit parameter | Start page, server bound, end protocol |
| Time | Raw JSON passed through | Time units not established by wrapper |
| Retention | Raw response JSON returned over MCP | Tool/session/cache/crash/server retention |

Do not infer provider list capabilities from the separate search `num` parameter.
Do not use client truncation as an actual fetch bound. Missing evidence fails closed.

## Proposed external minimum patch (NOT APPLIED)

Each item requires separate authorization to edit the external source. Deployment,
registration changes, credential access and restart require their own approval.

| Location | Proposal / risk addressed | Compatibility / acceptance |
| --- | --- | --- |
| `_get` TLS | Default verification; separately approved CA only; no fallback | Old invalid chains may now fail; fake HTTP-client assertions plus separately authorized real handshake |
| `_get` errors/output | Catch HTTP/TLS/timeout/JSON errors; fixed anonymous errors; never stringify request/exception or return raw upstream body | Changes output contract; synthetic canary tests over success/error/log channels |
| `_get` redirects/proxy | Explicit `allow_redirects=False`; deny all 3xx; controlled Session with `trust_env=False`; no debug/body logs | Proxy-dependent access may fail; approved explicit proxy is a separate design; test no second call/no inherited proxy |
| `file_list` scope | Remove default root; require exact approved canonical path before request | Omitted/ambiguous paths stop; fictional whitelist escape tests |
| `file_list` pagination | Block until documented request-side limit, numbering and end protocol exist; use verified limits only | Wrapper cannot currently guarantee <=100 fetched items; synthetic boundaries cannot prove server behavior |
| MCP output boundary | Internally adapt/validate and aggregate; emit counters/error counts, not metadata | Existing raw-response consumers need a separate reviewed contract; test no canary in tool output |

Token authentication protocol remains unchanged without official evidence. Even
safe output cannot erase endpoint/proxy logs. Runtime libraries, MCP/session logs,
crash dumps and OS paging remain UNKNOWN/NOT VERIFIED. Route B still requires
explicit consent for original responses to pass through tool/session records.

## Local verification

Use installed local tools only; no dependency downloads. Test fixtures are fictional
and use reserved `.invalid` URLs without any network. Policy tests are not TLS
handshake evidence. The site does not import this module.

The external build uses Vite's programmatic `build` with `copyPublicDir: false`
so the two protected untracked OCR packages are not opened or copied. It checks
application compilation/bundling, not completeness of a deployable public asset
package. Existing dist/configuration stays untouched; no deployment is authorized.
