import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_PATH = "/";
const RELEASE_SCOPE = "student-static-only";
const RELEASEABLE_ACCESS_STATUSES = new Set(["verified", "withdrawn"]);
const FORBIDDEN_MANIFEST_FIELD = /(?:fid|passcode|token|cookie|password|secret|credential|audit|source[_-]?path|raw[_-]?path|admin|server)/i;
const args = process.argv.slice(2);
const distArgument = args.find((argument) => !argument.startsWith("--")) ?? "dist";
const distRoot = path.resolve(distArgument);
const writeMetadata = args.includes("--write-metadata");
const errors = [];

const relativePath = (filePath) =>
  path.relative(distRoot, filePath).split(path.sep).join("/");

const fileExists = async (filePath) => {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
};

const collectFiles = async (directory) => {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }
  return files;
};

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

const gitValue = (gitArgs) => {
  try {
    return execFileSync("git", gitArgs, {
      cwd: path.resolve(distRoot, ".."),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
};

const inspectManifestKeys = (value, location = "manifest") => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectManifestKeys(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    const childLocation = `${location}.${key}`;
    if (FORBIDDEN_MANIFEST_FIELD.test(key)) {
      errors.push(`manifest contains a forbidden field: ${childLocation}`);
    }
    inspectManifestKeys(child, childLocation);
  }
};

const readJson = async (filePath, label) => {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    errors.push(`${label} is missing or invalid JSON`);
    return null;
  }
};

if (!(await fileExists(distRoot))) {
  errors.push(`artifact directory does not exist: ${distRoot}`);
}

const indexPath = path.join(distRoot, "index.html");
const fallbackPath = path.join(distRoot, "404.html");
const manifestPath = path.join(distRoot, "data", "manifest.v1.json");
const indexHtml = await fileExists(indexPath) ? await readFile(indexPath, "utf8") : "";
const fallbackHtml = await fileExists(fallbackPath) ? await readFile(fallbackPath, "utf8") : "";

for (const requiredPath of [indexPath, fallbackPath, manifestPath]) {
  if (!(await fileExists(requiredPath))) {
    errors.push(`missing required artifact file: ${relativePath(requiredPath)}`);
  }
}

if (indexHtml) {
  if (!indexHtml.includes(`const BASE_PATH = "${BASE_PATH}"`)) {
    errors.push("index.html does not contain the configured Pages base");
  }
  if (
    !indexHtml.includes("__zhaowenguan_pages_route") ||
    !indexHtml.includes("history.replaceState") ||
    !indexHtml.includes("KNOWN_APP_PATHS") ||
    !indexHtml.includes("KNOWN_PROFILE_PATHS") ||
    !indexHtml.includes("hasNestedRestoreParam")
  ) {
    errors.push("index.html is missing the deep-route restore bootstrap");
  }
}

if (fallbackHtml) {
  if (!fallbackHtml.includes(`const BASE_PATH = "${BASE_PATH}"`)) {
    errors.push("404.html does not contain the configured Pages base");
  }
  if (
    !fallbackHtml.includes("window.location.replace") ||
    !fallbackHtml.includes("KNOWN_APP_PATHS") ||
    !fallbackHtml.includes("KNOWN_PROFILE_PATHS") ||
    !fallbackHtml.includes("knownAppPath")
  ) {
    errors.push("404.html is missing the known-route deep-route fallback");
  }
  if (/<script\s+type=["']module/i.test(fallbackHtml) || /\/assets\//i.test(fallbackHtml)) {
    errors.push("404.html must not eagerly load the application bundle for missing assets");
  }
}

const manifest = await readJson(manifestPath, "data/manifest.v1.json");
if (manifest) {
  if (manifest.schemaVersion !== 1) {
    errors.push("manifest schemaVersion must be 1");
  }
  if (!Array.isArray(manifest.records)) {
    errors.push("manifest records must be an array");
  } else {
    manifest.records.forEach((record, index) => {
      if (!record || typeof record !== "object") {
        errors.push(`manifest record ${index + 1} is not an object`);
      } else if (!RELEASEABLE_ACCESS_STATUSES.has(record.accessStatus)) {
        errors.push(`manifest record ${index + 1} is not releaseable: accessStatus=${String(record.accessStatus)}`);
      } else {
        for (const field of ["id", "title", "categoryId", "provider", "shareUrl", "publishedAt"]) {
          if (typeof record[field] !== "string" || record[field].trim() === "") {
            errors.push(`manifest record ${index + 1} is missing a valid ${field}`);
          }
        }
        if (!new Set(["quark", "baidu"]).has(record.provider)) {
          errors.push(`manifest record ${index + 1} has an unsupported provider`);
        }
        if (
          typeof record.shareUrl === "string" &&
          !/^https:\/\/(?:pan\.quark\.cn|pan\.baidu\.com)\//i.test(record.shareUrl)
        ) {
          errors.push(`manifest record ${index + 1} has an unsupported share URL host`);
        }
        if (
          record.accessStatus === "verified" &&
          (typeof record.checkedOn !== "string" || Number.isNaN(Date.parse(record.checkedOn)))
        ) {
          errors.push(`manifest record ${index + 1} verified status requires checkedOn`);
        }
      }
    });
    inspectManifestKeys(manifest);
  }
}

let artifactEntries = [];
if (await fileExists(distRoot)) {
  const artifactFiles = await collectFiles(distRoot);
  for (const filePath of artifactFiles) {
    const normalizedPath = relativePath(filePath);
    if (/(?:^|\/)(?:admin|audit|audits|credentials?|private|server)(?:\/|$)/i.test(normalizedPath)) {
      errors.push(`student artifact contains a forbidden private/server path: ${normalizedPath}`);
    }
    if (/(?:fid|token|cookie|secret|credential)/i.test(normalizedPath)) {
      errors.push(`student artifact contains a forbidden sensitive filename: ${normalizedPath}`);
    }
    if (normalizedPath !== "release-metadata.json") {
      const bytes = await readFile(filePath);
      artifactEntries.push({
        path: normalizedPath,
        sizeBytes: bytes.byteLength,
        sha256: sha256(bytes),
      });
    }
  }
}

artifactEntries.sort((left, right) => left.path.localeCompare(right.path));
const artifactContentSha256 = sha256(
  artifactEntries
    .map((entry) => `${entry.path}\0${entry.sizeBytes}\0${entry.sha256}\n`)
    .join(""),
);
const manifestBytes = await fileExists(manifestPath) ? await readFile(manifestPath) : null;

if (errors.length > 0) {
  console.error("PAGES_ARTIFACT_BLOCKED");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const sourceRoot = path.resolve(distRoot, "..");
  const packageJson = JSON.parse(await readFile(path.join(sourceRoot, "package.json"), "utf8"));
  const metadata = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    releaseScope: RELEASE_SCOPE,
    source: {
      repository: process.env.GITHUB_REPOSITORY ?? "unbound/public-repository",
      ref: process.env.GITHUB_REF_NAME ?? gitValue(["branch", "--show-current"]),
      commit: process.env.GITHUB_SHA ?? gitValue(["rev-parse", "HEAD"]),
      workflowRun: process.env.GITHUB_RUN_ID ?? "local",
    },
    build: {
      packageVersion: packageJson.version,
      nodeVersion: process.version,
      basePath: BASE_PATH,
    },
    manifest: {
      path: "data/manifest.v1.json",
      recordCount: manifest.records.length,
      sha256: sha256(manifestBytes),
    },
    artifact: {
      fileCount: artifactEntries.length,
      contentSha256: artifactContentSha256,
      digestExcludes: ["release-metadata.json"],
      files: artifactEntries,
    },
  };

  if (writeMetadata) {
    await writeFile(
      path.join(distRoot, "release-metadata.json"),
      `${JSON.stringify(metadata, null, 2)}\n`,
      "utf8",
    );
  }

  console.log("PAGES_ARTIFACT_PASS");
  console.log(`releaseScope=${RELEASE_SCOPE}`);
  console.log(`sourceCommit=${metadata.source.commit}`);
  console.log(`packageVersion=${metadata.build.packageVersion}`);
  console.log(`manifestSha256=${metadata.manifest.sha256}`);
  console.log(`artifactContentSha256=${artifactContentSha256}`);
  if (writeMetadata) console.log("releaseMetadata=release-metadata.json");
}
