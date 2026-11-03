import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const [baselineArg, previewArg, candidateArg] = process.argv.slice(2);

if (!baselineArg || !previewArg || !candidateArg) {
  console.error(
    "Usage: node scripts/verify-hs-first-batch-integration.mjs " +
      "<production-manifest> <isolated-preview-manifest> <candidate-manifest>",
  );
  process.exitCode = 2;
} else {
  const readManifest = async (fileArg) => {
    const filePath = path.resolve(fileArg);
    return JSON.parse(await readFile(filePath, "utf8"));
  };

  const [baseline, preview, candidate] = await Promise.all([
    readManifest(baselineArg),
    readManifest(previewArg),
    readManifest(candidateArg),
  ]);
  const errors = [];
  const highSchoolIds = new Set([
    "hs-gaokao-2024-new-standard-1-001",
    "hs-gaokao-2024-new-standard-2-002",
    "hs-gaokao-2024-national-jia-003",
    "hs-gaokao-2025-national-1-004",
    "hs-gaokao-2025-national-2-005",
  ]);

  const duplicateIds = (manifest, label) => {
    const ids = manifest.records.map((record) => record.id);
    if (new Set(ids).size !== ids.length) errors.push(`${label} has duplicate IDs`);
    return ids;
  };

  duplicateIds(baseline, "production baseline");
  const previewIds = duplicateIds(preview, "isolated preview");
  const candidateIds = duplicateIds(candidate, "release candidate");
  const baselineById = new Map(baseline.records.map((record) => [record.id, record]));
  const previewById = new Map(preview.records.map((record) => [record.id, record]));
  const candidateById = new Map(candidate.records.map((record) => [record.id, record]));

  if (baseline.records.length !== 13) errors.push("production baseline must contain 13 records");
  if (preview.records.length !== 5) errors.push("isolated preview must contain 5 records");
  if (candidate.records.length !== 18) errors.push("release candidate must contain 18 records");
  if (previewIds.some((id) => !highSchoolIds.has(id))) {
    errors.push("isolated preview contains a non-first-batch ID");
  }
  if (candidateIds.some((id) => !baselineById.has(id) && !highSchoolIds.has(id))) {
    errors.push("release candidate contains an out-of-scope ID");
  }

  for (const [id, record] of baselineById) {
    const candidateRecord = candidateById.get(id);
    if (!candidateRecord) {
      errors.push(`production record missing from candidate: ${id}`);
    } else if (JSON.stringify(candidateRecord) !== JSON.stringify(record)) {
      errors.push(`production record changed: ${id}`);
    }
  }

  for (const [id, record] of previewById) {
    const candidateRecord = candidateById.get(id);
    if (!candidateRecord) {
      errors.push(`high-school record missing from candidate: ${id}`);
      continue;
    }
    if (JSON.stringify(candidateRecord) !== JSON.stringify(record)) {
      errors.push(`high-school preview record changed: ${id}`);
    }
    if (candidateRecord.categoryId !== "exam-senior-gaokao") {
      errors.push(`high-school record has wrong category: ${id}`);
    }
    if (
      candidateRecord.provider !== "quark" ||
      candidateRecord.accessStatus !== "verified" ||
      typeof candidateRecord.shareUrl !== "string" ||
      !/^https:\/\/pan\.quark\.cn\/s\/[A-Za-z0-9_-]+\/?$/u.test(candidateRecord.shareUrl)
    ) {
      errors.push(`high-school record failed public link checks: ${id}`);
    }
  }

  if (candidate.records.filter((record) => highSchoolIds.has(record.id)).length !== 5) {
    errors.push("candidate high-school record count must be 5");
  }

  if (errors.length > 0) {
    console.error("HS_FIRST_BATCH_INTEGRATION_BLOCKED");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(
      "HS_FIRST_BATCH_INTEGRATION_PASS " +
        `baselineRecords=${baseline.records.length} ` +
        `previewRecords=${preview.records.length} ` +
        `candidateRecords=${candidate.records.length} ` +
        "unchangedProduction=13 addedHighSchool=5 category=exam-senior-gaokao uniqueIds=18",
    );
  }
}
