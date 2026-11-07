import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const distRoot = path.resolve(process.argv[2] ?? path.join(root, "dist"));
const configuredSourcePath = process.env.B2_SOURCE_MANIFEST_PATH?.trim();
const sourcePath = path.resolve(
  root,
  configuredSourcePath || "scripts/input/manifest.v1.source.fixture.json",
);
const manifestPath = path.join(distRoot, "data", "manifest.v1.json");
const publicRoot = path.resolve(root, "public");
if (
  sourcePath.toLowerCase() === publicRoot.toLowerCase() ||
  sourcePath.toLowerCase().startsWith(`${publicRoot.toLowerCase()}${path.sep}`)
) {
  console.error("B2-3 source input must not be read from public/");
  process.exit(1);
}

const APPROVED_IDS = new Set([
  "university-topic-math-001",
  "university-topic-professional-courses-001",
  "university-topic-textbooks-001",
  "university-topic-ideology-001",
  "university-topic-competition-001",
  "university-topic-cet-001",
  "university-topic-ielts-001",
  "university-topic-proof-001",
  "university-topic-computer-001",
  "university-topic-postgrad-001",
  "university-topic-career-001",
  "university-quark-career-ppt-001",
  "university-quark-resume-templates-001",
  "certification-topic-university-001",
  "certification-topic-foreign-language-001",
  "certification-topic-upgrade-001",
  "certification-topic-civil-service-001",
  "jh-topic-textbooks-001",
  "jh-topic-workbooks-001",
  "jh-topic-exams-001",
  "jh-topic-courses-001",
  "jh-topic-subjects-001",
  "jh-topic-sprint-001",
  "hs-topic-workbooks-001",
  "hs-topic-textbooks-001",
  "hs-topic-courses-001",
  "hs-topic-mock-001",
  "hs-topic-sprint-001",
  "hs-topic-subjects-001",
  "hs-topic-one-series-001",
  "hs-topic-competition-001",
  "hs-topic-volunteer-001",
  "hs-topic-policies-001",
]);

const readJson = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));
const collectFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(entryPath));
    else files.push(entryPath);
  }
  return files;
};

const source = await readJson(sourcePath);
const manifest = await readJson(manifestPath);
const files = await collectFiles(distRoot);
const artifactBytes = await Promise.all(files.map((filePath) => readFile(filePath)));
const errors = [];
const sourceById = new Map(source.records.map((record) => [record.id, record]));
const outputIds = new Set(manifest.records.map((record) => record.id));

if (manifest.schemaVersion !== 1) errors.push("schemaVersion");
if (manifest.records.length !== APPROVED_IDS.size) errors.push("unexpected public record count");
for (const id of outputIds) if (!APPROVED_IDS.has(id)) errors.push(`unexpected public id: ${id}`);
for (const id of APPROVED_IDS) if (!outputIds.has(id)) errors.push(`missing approved id: ${id}`);
for (const record of manifest.records) {
  const sourceRecord = sourceById.get(record.id);
  if (!sourceRecord) {
    errors.push(`public record missing source: ${record.id}`);
    continue;
  }
  for (const key of [
    "evidenceId",
    "actionScope",
    "audienceScope",
    "platformScope",
    "validFrom",
    "validUntil",
    "evidenceRef",
    "reviewedAt",
    "deliveryId",
    "display_metadata",
    "expose_share_link",
  ]) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      errors.push(`internal field in public record ${record.id}: ${key}`);
    }
  }
  if (record.shareUrl === null) {
    if (Object.prototype.hasOwnProperty.call(record, "passcode")) {
      errors.push(`passcode without link: ${record.id}`);
    }
  } else if (record.shareUrl !== sourceRecord.shareUrl) {
    errors.push(`authorized link changed: ${record.id}`);
  }
}

const hiddenRecords = source.records.filter((record) => !outputIds.has(record.id));
for (const record of hiddenRecords) {
  const idBytes = Buffer.from(record.id, "utf8");
  if (artifactBytes.some((bytes) => bytes.includes(idBytes))) {
    errors.push(`hidden resource ID leaked: ${record.id}`);
  }
  if (typeof record.shareUrl === "string") {
    const urlBytes = Buffer.from(record.shareUrl, "utf8");
    if (artifactBytes.some((bytes) => bytes.includes(urlBytes))) {
      errors.push(`hidden share URL leaked: ${record.id}`);
    }
  }
}

if (errors.length > 0) {
  console.error("B2-3_PUBLIC_OUTPUT_BLOCKED");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const metadataOnly = manifest.records.filter((record) => record.shareUrl === null).length;
  console.log(
    `B2-3_PUBLIC_OUTPUT_PASS publicRecords=${manifest.records.length} ` +
      `exposedLinks=${manifest.records.length - metadataOnly} ` +
      `metadataOnly=${metadataOnly} hiddenHistoricalRecords=${hiddenRecords.length}`,
  );
}
