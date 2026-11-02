import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parsePublicManifest } from "../src/publicManifest";
import { projectManifestToPublic } from "../src/publicProjection";
import {
  B2_3_CONTEXT,
  B2_3_POLICIES,
} from "./b2-3-authorization-policy";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "scripts/input/manifest.v1.source.json");
const outputPath = resolve(root, "public/data/manifest.v1.json");

const source = parsePublicManifest(
  JSON.parse(readFileSync(sourcePath, "utf8")) as unknown,
);
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
