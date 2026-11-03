import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parsePublicManifest } from "../src/publicManifest";
import { projectManifestToPublic } from "../src/publicProjection";
import {
  B2_3_CONTEXT,
  B2_3_POLICIES,
} from "./b2-3-authorization-policy";
import { readB2SourceManifest } from "./b2-3-build-input";

const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "public/data/manifest.v1.json");

const { manifest: source } = readB2SourceManifest(root);
const projection = projectManifestToPublic(
  source,
  B2_3_POLICIES,
  B2_3_CONTEXT,
);
const output = parsePublicManifest(projection.manifest);

writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

const exposedLinks = output.records.filter((record) => record.shareUrl !== null).length;
const metadataOnly = output.records.length - exposedLinks;
const omitted = projection.decisions.filter((decision) => !decision.metadataExposed).length;

console.log(
  `B2-3_PUBLIC_MANIFEST_PASS sourceRecords=${source.records.length} ` +
    `publicRecords=${output.records.length} exposedLinks=${exposedLinks} ` +
    `metadataOnly=${metadataOnly} omitted=${omitted}`,
);
