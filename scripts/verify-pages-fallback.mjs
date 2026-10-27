import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const BASE_PATH = "/";
const ORIGIN = "https://example.invalid";
const ROUTE_PARAM = "__zhaowenguan_pages_route";

const args = process.argv.slice(2);
const distArgument = args.find((argument) => !argument.startsWith("--")) ?? "dist";
const distRoot = path.resolve(distArgument);
const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const results = [];

const readAppRouteWhitelist = async () => {
  try {
    const appSource = await readFile(path.join(sourceRoot, "src", "App.tsx"), "utf8");
    const sectionsSource = await readFile(
      path.join(sourceRoot, "src", "mySections.ts"),
      "utf8",
    );
    const pathsBlock = appSource.match(
      /const paths: Record<Page, string> = \{([\s\S]*?)\n\};/,
    );
    const sectionsBlock = sectionsSource.match(
      /mySections\s*=\s*\[([\s\S]*?)\]\s+as const/,
    );
    if (!pathsBlock || !sectionsBlock) {
      throw new Error("App.tsx paths or mySections table is missing");
    }
    return {
      appPaths: [...pathsBlock[1].matchAll(/:\s*"([^"]+)"/g)].map(
        (entry) => entry[1],
      ),
      profilePaths: [...sectionsBlock[1].matchAll(/"([^"]+)"/g)].map(
        (entry) => `/profile/${entry[1]}`,
      ),
    };
  } catch (error) {
    errors.push(
      `unable to read the existing App route whitelist: ${error instanceof Error ? error.message : String(error)}`,
    );
    return { appPaths: [], profilePaths: [] };
  }
};

const {
  appPaths: KNOWN_APP_PATHS,
  profilePaths: KNOWN_PROFILE_PATHS,
} = await readAppRouteWhitelist();

const fileExists = async (filePath) => {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
};

const check = (suite, name, passed, detail = "") => {
  results.push({ suite, name, passed });
  if (!passed) errors.push(`${suite}: ${name}${detail ? ` (${detail})` : ""}`);
};

const readArtifactFile = async (relativePath) => {
  const filePath = path.join(distRoot, relativePath);
  if (!(await fileExists(filePath))) {
    errors.push(`missing artifact file: ${relativePath}`);
    return "";
  }
  return readFile(filePath, "utf8");
};

const extractInlineScript = (html, label) => {
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1])
    .filter((script) => script.includes("KNOWN_APP_PATHS"));
  if (scripts.length !== 1) {
    errors.push(`${label} must contain exactly one inline route policy script`);
    return "";
  }
  return scripts[0];
};

const extractSetValues = (html, name, label) => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`const ${escapedName} = new Set\\(\\[([\\s\\S]*?)\\]\\);`));
  if (!match) {
    errors.push(`${label} is missing ${name}`);
    return [];
  }
  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
};

const sameSet = (left, right) =>
  left.length === right.length && [...left].sort().every((value, index) => value === [...right].sort()[index]);

const runFallback = (script, href) => {
  const url = new URL(href, ORIGIN);
  let redirectedTo = null;
  let executionError = null;
  const window = {
    location: {
      origin: url.origin,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      replace(value) {
        redirectedTo = new URL(value, url.origin).href;
      },
    },
  };
  try {
    vm.runInNewContext(script, { URL, URLSearchParams, decodeURIComponent, window }, { timeout: 1000 });
  } catch (error) {
    executionError = error instanceof Error ? error.message : String(error);
  }
  return { redirectedTo, executionError };
};

const runRestore = (script, requestedRoute) => {
  const indexUrl = new URL(BASE_PATH, ORIGIN);
  indexUrl.searchParams.set(ROUTE_PARAM, requestedRoute);
  let replacedWith = null;
  let executionError = null;
  const window = {
    location: {
      origin: indexUrl.origin,
      pathname: indexUrl.pathname,
      search: indexUrl.search,
      hash: indexUrl.hash,
    },
    history: {
      replaceState(_state, _title, value) {
        replacedWith = new URL(value, indexUrl.origin).href;
      },
    },
  };
  try {
    vm.runInNewContext(script, { URL, URLSearchParams, decodeURIComponent, window }, { timeout: 1000 });
  } catch (error) {
    executionError = error instanceof Error ? error.message : String(error);
  }
  return { replacedWith, executionError };
};

const indexHtml = await readArtifactFile("index.html");
const fallbackHtml = await readArtifactFile("404.html");
const indexScript = extractInlineScript(indexHtml, "index.html");
const fallbackScript = extractInlineScript(fallbackHtml, "404.html");
const auditCounterexamples = [
  "assets/__missing__.txt",
  "assets/__missing__.webmanifest",
  "assets/__missing__.html",
  "assets/__missing__.bin",
  "assets/__missing__.bcmap",
  "assets/__missing__.csv",
  "assets/__missing__.zip",
  "assets/__missing__.mp4",
  "assets/__missing__%2Ejs",
  "ocr/tesseract/core/__missing__",
  "not-a-real-app-route",
];

if (indexHtml && fallbackHtml && indexScript && fallbackScript) {
  const indexAppPaths = extractSetValues(indexHtml, "KNOWN_APP_PATHS", "index.html");
  const fallbackAppPaths = extractSetValues(fallbackHtml, "KNOWN_APP_PATHS", "404.html");
  const indexProfilePaths = extractSetValues(indexHtml, "KNOWN_PROFILE_PATHS", "index.html");
  const fallbackProfilePaths = extractSetValues(fallbackHtml, "KNOWN_PROFILE_PATHS", "404.html");
  check("policy", "index and 404 use the same known app route set", sameSet(indexAppPaths, fallbackAppPaths));
  check("policy", "index route set matches App paths", sameSet(indexAppPaths, KNOWN_APP_PATHS));
  check("policy", "404 route set matches App paths", sameSet(fallbackAppPaths, KNOWN_APP_PATHS));
  check("policy", "index and 404 use the same profile route set", sameSet(indexProfilePaths, fallbackProfilePaths));
  check("policy", "index profile set matches explicit App subpages", sameSet(indexProfilePaths, KNOWN_PROFILE_PATHS));
  check("policy", "404 profile set matches explicit App subpages", sameSet(fallbackProfilePaths, KNOWN_PROFILE_PATHS));
  check("policy", "404 does not load an application module", !/<script\s+type=["']module/i.test(fallbackHtml));
  check("policy", "404 does not reference the application asset directory", !/\/assets\//i.test(fallbackHtml));

  for (const relativePath of auditCounterexamples) {
    const result = runFallback(fallbackScript, `${ORIGIN}${BASE_PATH}${relativePath}`);
    check(
      "audit-11",
      relativePath,
      !result.executionError && result.redirectedTo === null,
      result.executionError ?? result.redirectedTo ?? "unexpected redirect",
    );
  }

  const originalFallbackCases = [
    ["/resources", true],
    ["/categories", true],
    ["/tools/ocr", true],
    ["/detail?id=example-resource", true],
    ["/resources?q=%E7%BA%BF%E4%BB%A3&sort=newest#results", true],
    ["/categories/?category=stage-university#top", true],
    ["/", false],
    ["/unknown-root", false],
    ["/other-repo/resources", false],
    ["/other-repo-evil/resources", false],
    ["/assets/__missing__.js", false],
    ["/assets/__missing__.mjs", false],
    ["/assets/__missing__.css", false],
    ["/assets/__missing__.json", false],
    ["/assets/__missing__.wasm", false],
    ["/assets/__missing__.ttf", false],
    ["/assets/__missing__.png", false],
    ["/assets/__missing__.svg", false],
    ["/assets/__missing__.traineddata.gz", false],
    ["/assets/__missing__.map", false],
    ["/assets/__missing__.woff2", false],
    ["/assets/__missing__.txt", false],
    ["/assets/__missing__.webmanifest", false],
    ["/assets/__missing__.html", false],
    ["/assets/__missing__.bin", false],
    ["/assets/__missing__.bcmap", false],
    ["/assets/__missing__.csv", false],
    ["/assets/__missing__.zip", false],
    ["/assets/__missing__.mp4", false],
    ["/assets/__missing__%2Ejs", false],
    ["/ocr/tesseract/core/__missing__", false],
    ["/not-a-real-app-route", false],
  ];
  for (const [route, shouldRedirect] of originalFallbackCases) {
    const result = runFallback(fallbackScript, `${ORIGIN}${route}`);
    const redirectedRoute = result.redirectedTo ? new URL(result.redirectedTo) : null;
    const expectedRoute = shouldRedirect ? `${new URL(route, ORIGIN).pathname}${new URL(route, ORIGIN).search}${new URL(route, ORIGIN).hash}` : null;
    const passed = !result.executionError && (
      shouldRedirect
        ? redirectedRoute?.pathname === BASE_PATH &&
          redirectedRoute.searchParams.get(ROUTE_PARAM) === expectedRoute &&
          redirectedRoute.searchParams.getAll(ROUTE_PARAM).length === 1
        : result.redirectedTo === null
    );
    check("original-41", route, passed, result.executionError ?? result.redirectedTo ?? "redirect missing");
  }

  const originalRestoreRoutes = [
    "/resources",
    "/categories",
    "/tools/ocr",
    "/detail?id=example-resource",
    "/resources?q=%E7%BA%BF%E4%BB%A3&sort=newest#results",
    "/categories/?category=stage-university#top",
  ];
  for (const route of originalRestoreRoutes) {
    const result = runRestore(indexScript, route);
    check(
      "original-41",
      `restore ${route}`,
      !result.executionError && result.replacedWith === new URL(route, ORIGIN).href,
      result.executionError ?? result.replacedWith ?? "replaceState missing",
    );
  }

  const originalRestoreBoundaries = [
    "https://unrelated.example/resources",
    "/other-repo/resources",
    "/other-repo-evil/resources",
  ];
  for (const route of originalRestoreBoundaries) {
    const result = runRestore(indexScript, route);
    check("original-41", `reject restore ${route}`, !result.executionError && result.replacedWith === null, result.executionError ?? result.replacedWith ?? "unexpected replaceState");
  }

  const original41Results = results.filter((result) => result.suite === "original-41");
  check("summary", "the original 41 fallback cases all pass", original41Results.length === 41 && original41Results.every((result) => result.passed), `${original41Results.filter((result) => result.passed).length}/41`);

  const legalRoutes = [...KNOWN_APP_PATHS, ...KNOWN_PROFILE_PATHS].filter((route) => route !== "/");
  for (const route of legalRoutes) {
    const result = runFallback(fallbackScript, `${ORIGIN}${BASE_PATH.slice(0, -1)}${route}`);
    check("known-routes", route, !result.executionError && result.redirectedTo !== null, result.executionError ?? "known route did not redirect");
  }

  const negativeFallbackRoutes = [
    "/resources.js",
    "/tools/ocr.json",
    "/about.txt",
    "/profileevil",
    "/resources//",
    "/resources%2F",
    "/resources%ZZ",
    "/resources%2E",
    "/assets/missing",
    "/data/missing",
    "/ocr/tesseract/core/missing",
    "/fonts/missing",
  ];
  for (const route of negativeFallbackRoutes) {
    const result = runFallback(fallbackScript, `${ORIGIN}${route}`);
    check("negative-fallback", route, !result.executionError && result.redirectedTo === null, result.executionError ?? result.redirectedTo ?? "unexpected redirect");
  }

  const maliciousRestoreRoutes = [
    "javascript:alert(1)",
    "https://unrelated.example/resources",
    "/other-repo/resources",
    "/assets/missing.js",
    "/data/missing",
    "/ocr/tesseract/core/missing",
    "/fonts/missing",
    "/not-a-real-app-route",
    "/resources.js",
    "/assets/missing%2Ejs",
    "/resources%2F",
    "/%2e%2e/resources",
    "/resources//",
    "/resources?__zhaowenguan_pages_route=/resources",
    "",
  ];
  for (const route of maliciousRestoreRoutes) {
    const result = runRestore(indexScript, route);
    check("negative-restore", route || "empty restore value", !result.executionError && result.replacedWith === null, result.executionError ?? result.replacedWith ?? "unexpected replaceState");
  }
}

const original41Results = results.filter((result) => result.suite === "original-41");
const audit11Results = results.filter((result) => result.suite === "audit-11");
const negativeResults = results.filter((result) => result.suite.startsWith("negative-"));
const passed = results.filter((result) => result.passed).length;
console.log(`P1_B_FALLBACK_${errors.length === 0 ? "PASS" : "BLOCKED"}`);
console.log(`audit11=${audit11Results.filter((result) => result.passed).length}/${audit11Results.length}`);
console.log(`original41=${original41Results.filter((result) => result.passed).length}/${original41Results.length}`);
console.log(`negative=${negativeResults.filter((result) => result.passed).length}/${negativeResults.length}`);
console.log(`allChecks=${passed}/${results.length}`);
if (errors.length > 0) {
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
}
