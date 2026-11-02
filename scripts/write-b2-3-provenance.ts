import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { readB2SourceManifest } from "./b2-3-build-input";

const root = resolve(import.meta.dirname, "..");
const distRoot = resolve(root, process.argv[2] ?? "dist");
const manifestPath = resolve(distRoot, "data/manifest.v1.json");
const provenancePath = resolve(distRoot, "b2-3-provenance.json");
const { manifest: source } = readB2SourceManifest(root);
const publicManifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
  records?: unknown[];
};
const publicManifestBytes = readFileSync(manifestPath);
const publicRecordCount = Array.isArray(publicManifest.records)
  ? publicManifest.records.length
  : -1;

const publicManifestSha256 = createHash("sha256")
  .update(publicManifestBytes)
  .digest("hex");

writeFileSync(
  provenancePath,
  `${JSON.stringify(
    {
      schemaVersion: 1,
      kind: "b2-3-public-projection",
      sourceRecordCount: source.records.length,
      publicRecordCount,
      omittedRecordCount: source.records.length - publicRecordCount,
      publicManifestSha256,
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(
  `B2-3_PROVENANCE_PASS sourceRecords=${source.records.length} ` +
    `publicRecords=${publicRecordCount} manifestSha256=${publicManifestSha256}`,
);
