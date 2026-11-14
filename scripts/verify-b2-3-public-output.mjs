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
  "university-topic-major-001",
  "university-topic-math-001",
  "university-topic-professional-courses-001",
  "university-topic-textbooks-001",
  "university-topic-ideology-001",
  "university-topic-competition-root-001",
  "university-topic-competition-001",
  "university-topic-cet-001",
  "university-topic-ielts-001",
  "university-topic-proof-001",
  "university-topic-computer-001",
  "university-topic-postgraduate-001",
  "university-topic-postgrad-001",
  "university-topic-planning-001",
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
  "jh-textbooks-subject-dao-fa-001",
  "jh-textbooks-subject-geography-001",
  "jh-textbooks-subject-geography-atlas-001",
  "jh-textbooks-subject-chemistry-001",
  "jh-textbooks-subject-science-001",
  "jh-textbooks-subject-history-001",
  "jh-textbooks-subject-biology-001",
  "jh-textbooks-subject-math-001",
  "jh-textbooks-subject-physics-001",
  "jh-textbooks-subject-english-001",
  "jh-textbooks-subject-chinese-001",
  "jh-workbooks-math-core-001",
  "jh-workbooks-lixiangshu-001",
  "jh-workbooks-yibanguo-001",
  "jh-workbooks-wanwei-001",
  "jh-workbooks-kuaijie-english-001",
  "jh-workbooks-kekezhixing-001",
  "jh-workbooks-xiaoti-kuangzuo-001",
  "jh-workbooks-zhongkao-english-vocab-001",
  "jh-workbooks-xinghuo-english-001",
  "jh-workbooks-wusan-001",
  "jh-workbooks-jinkaojuan-001",
  "jh-workbooks-baiti-daguoguan-001",
  "jh-workbooks-xueyi-jinjuan-001",
  "jh-exams-real-001",
  "jh-exams-mock-001",
  "jh-courses-by-org-001",
  "jh-courses-by-grade-001",
  "jh-subjects-math-001",
  "jh-subjects-physics-001",
  "jh-subjects-chinese-001",
  "jh-sprint-exam-papers-001",
  "jh-sprint-english-001",
  "jh-sprint-physics-001",
  "jh-sprint-math-001",
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
  "hs-courses-2027-001",
  "hs-courses-by-org-001",
  "hs-one-series-yishu-001",
  "hs-one-series-yisheng-001",
  "hs-one-series-yiying-001",
  "hs-one-series-yidi-001",
  "hs-one-series-yihua-001",
  "hs-one-series-yizheng-001",
  "hs-one-series-yiwu-001",
  "hs-one-series-last-ten-lessons-001",
  "hs-one-series-free-gaokao-001",
  "hs-one-series-huang-furen-001",
  "hs-one-series-shiyou-yuwen-001",
  "hs-subjects-chinese-001",
  "hs-subjects-physics-001",
  "hs-subjects-chemistry-001",
  "hs-subjects-math-001",
  "hs-subjects-geography-001",
  "hs-subjects-english-001",
  "hs-subjects-history-001",
  "hs-subjects-biology-001",
  "hs-subjects-politics-001",
  "hs-competition-foundation-001",
  "hs-competition-real-001",
  "hs-workbooks-first-round-2027-001",
  "hs-workbooks-synchronous-2027-001",
  "hs-sprint-answering-001",
  "hs-sprint-papers-001",
  "hs-sprint-class-001",
  "hs-mocks-real-001",
  "hs-mocks-academic-001",
  "hs-mocks-mock-001",
  "hs-mocks-guangdong-spring-001",
  "hs-textbooks-after-school-answers-001",
  "hs-textbooks-japanese-001",
  "hs-textbooks-russian-001",
  "hs-textbooks-information-technology-001",
  "hs-textbooks-general-technology-001",
  "hs-textbooks-politics-001",
  "hs-textbooks-english-001",
  "hs-textbooks-chinese-001",
  "hs-textbooks-arts-001",
  "hs-textbooks-music-001",
  "hs-textbooks-physics-001",
  "hs-textbooks-physical-education-001",
  "hs-textbooks-math-001",
  "hs-textbooks-biology-001",
  "hs-textbooks-fine-arts-001",
  "hs-textbooks-history-001",
  "hs-textbooks-chemistry-001",
  "hs-textbooks-geography-001",
  "hs-textbooks-mental-health-001",
  "hs-volunteer-college-life-001",
  "hs-volunteer-admissions-friend-001",
  "hs-volunteer-zhang-xuefeng-001",
  "hs-volunteer-forms-001",
  "hs-volunteer-materials-001",
  "hs-volunteer-peoples-daily-001",
  "hs-policies-new-curriculum-001",
  "hs-policies-repeat-study-001",
  "hs-policies-textbook-comparison-001",
  "hs-policies-exam-notes-001",
  "ai-learning-cognition-001",
  "ai-chatgpt-001",
  "ai-chatgpt-002",
  "ai-deepseek-001",
  "ai-deepseek-002",
  "skill-coding-scratch-001",
  "skill-coding-python-001",
  "skill-coding-cpp-001",
  "skill-coding-robotics-001",
  "skill-coding-extension-001",
  "skill-ps-video-001",
  "skill-ps-online-001",
  "skill-jianying-001",
  "skill-premiere-001",
  "skill-video-assets-001",
  "skill-music-sfx-001",
  "skill-social-short-video-001",
  "skill-social-wechat-001",
  "skill-social-xiaohongshu-001",
  "skill-driving-subject-1-001",
  "skill-driving-subject-2-001",
  "skill-driving-subject-3-001",
  "skill-driving-subject-4-001",
  "skill-driving-question-bank-001",
  "skill-calligraphy-online-001",
  "skill-calligraphy-rubbings-001",
  "skill-travel-ticketing-001",
  "skill-clip-tutorial-01",
  "skill-clip-tutorial-02",
  "skill-clip-tutorial-05",
  "skill-clip-tutorial-08",
  "skill-clip-tutorial-09",
  "skill-clip-tutorial-10",
  "skill-clip-tutorial-11",
  "skill-clip-tutorial-13",
  "skill-clip-tutorial-15",
  "skill-clip-tutorial-21",
  "skill-clip-tutorial-22",
  "skill-clip-tutorial-25",
  "skill-clip-tutorial-26",
  "skill-clip-tutorial-31",
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
