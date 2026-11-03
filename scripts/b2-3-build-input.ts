import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import {
  parsePublicManifest,
  type PublicManifest,
} from "../src/publicManifest";

export const B2_SOURCE_MANIFEST_PATH_ENV = "B2_SOURCE_MANIFEST_PATH";
export const B2_DEFAULT_SOURCE_MANIFEST =
  "scripts/input/manifest.v1.source.fixture.json";

const isInside = (candidate: string, directory: string) => {
  const normalizedCandidate = candidate.toLowerCase();
  const normalizedDirectory = directory.toLowerCase();
  return (
    normalizedCandidate === normalizedDirectory ||
    normalizedCandidate.startsWith(`${normalizedDirectory}${sep}`)
  );
};

export const resolveB2SourceManifestPath = (
  root: string,
  configuredPath = process.env[B2_SOURCE_MANIFEST_PATH_ENV]?.trim(),
) => {
  const candidate = configuredPath || B2_DEFAULT_SOURCE_MANIFEST;
  const sourcePath = resolve(root, candidate);
  const publicRoot = resolve(root, "public");
  if (isInside(sourcePath, publicRoot)) {
    throw new Error(
      `B2_SOURCE_MANIFEST_FORBIDDEN: source input must not be read from public/: ${sourcePath}`,
    );
  }
  return sourcePath;
};

export const readB2SourceManifest = (
  root: string,
  configuredPath?: string,
): { path: string; manifest: PublicManifest } => {
  const sourcePath = resolveB2SourceManifestPath(root, configuredPath);
  let raw: string;
  try {
    raw = readFileSync(sourcePath, "utf8");
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw new Error(`B2_SOURCE_MANIFEST_MISSING: ${sourcePath}`);
    }
    throw error;
  }
  return {
    path: sourcePath,
    manifest: parsePublicManifest(JSON.parse(raw) as unknown),
  };
};
