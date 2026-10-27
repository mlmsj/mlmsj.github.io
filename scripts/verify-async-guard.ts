type Result = { id: number; value: string };
function createGuard() { let token = 0; let alive = true; return { begin: () => ++token, valid: (id: number) => alive && id === token, dispose: () => { alive = false; token += 1; } }; }
async function delayed(guard: ReturnType<typeof createGuard>, value: string, ms: number, sink: Result[]) { const id = guard.begin(); await new Promise(resolve => setTimeout(resolve, ms)); if (guard.valid(id)) sink.push({ id, value }); }
async function expectLatest(label: string, firstMs: number, secondMs: number) { const guard = createGuard(); const sink: Result[] = []; await Promise.all([delayed(guard, "old", firstMs, sink), delayed(guard, "new", secondMs, sink)]); if (sink.map(x => x.value).join(",") !== "new") throw new Error(`${label}: ${JSON.stringify(sink)}`); }
await expectLatest("old task finishes last", 35, 5);
await expectLatest("old task finishes first", 5, 35);
const switching = createGuard(); const sink: Result[] = []; const old = delayed(switching, "old-file", 20, sink); switching.begin(); await old; if (sink.length) throw new Error(`file switch accepted stale result: ${JSON.stringify(sink)}`);
const failed = createGuard(); const retry: Result[] = []; const failedId = failed.begin(); await Promise.resolve(); if (!failed.valid(failedId)) throw new Error("fresh failed task invalidated unexpectedly"); failed.begin(); if (failed.valid(failedId)) throw new Error("retry did not invalidate failed task"); const retryId = failed.begin(); if (failed.valid(retryId)) retry.push({ id: retryId, value: "retry" }); if (retry.length !== 1) throw new Error("retry did not produce current result");
const disposed = createGuard(); const disposeId = disposed.begin(); disposed.dispose(); if (disposed.valid(disposeId)) throw new Error("disposed task remained valid");
console.log(JSON.stringify({ cases: 5, passed: 5, failed: 0 }, null, 2));
