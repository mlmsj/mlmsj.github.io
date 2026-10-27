# Offline catalog

This directory contains pure TypeScript models and deterministic functions for R13-D-2A. It has no provider SDK, network, persistence, UI, or publishing integration.

## Boundaries

- `ProviderFile` is one normalized observation. Provider IDs, names, paths, hashes, and scope locators are private metadata.
- `ScanBatch` records the exact scope and completeness evidence. A capped, failed, or partially paginated scan cannot be scope-complete.
- `SnapshotDiff` is separate from the observation. Location and content changes may create two field-level records for the same identity.
- `restored` requires an explicit prior missing-candidate identity set.
- Duplicate candidates are review hints only. Comparable hashes produce strong candidates; normalized name plus size produces weak candidates. No candidate is merged automatically.
- `CatalogResourceDraft` is isolated from `src/resources.ts` and can only be a draft. Conversion, publication, databases, sharing, and admin workflows belong to a future R13-B phase.

## Provider adapters for D-2B

Future adapters must normalize only an explicitly authorized small directory. Baidu directory listing must use a verified path unless its MCP later proves ID lookup. Quark directory listing must use its documented FID only after installation/OAuth gates are separately approved. Adapters must preserve raw timestamp values and identify their units before conversion.

Private snapshots must not be written to this repository. A future storage design must separately approve an excluded local path, encryption/access controls, retention, and secret-safe reporting. Share links and passcodes require a separate encrypted-reference entity and are intentionally absent here.

## Simulated adapters

`adapters/` contains pure, offline transforms for fictional Baidu `file_list`-shaped entries and fictional Quark `browse`-shaped entries. They are based on static interface documentation and are not proof of current provider behavior. Timestamp units must be supplied explicitly. Unsafe numeric IDs, ambiguous time values, undocumented path structures, duplicate identities, and pagination anomalies fail closed with structured errors that contain only anonymous record positions.

The pagination collector consumes already-provided pages; it never fetches, retries, recurses, installs tools, or authenticates. Its defaults model a future maximum of two pages or 100 items. Reaching either boundary without an explicit provider end signal remains partial and cannot support a missing-file conclusion.
