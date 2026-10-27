import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const BASE_PATH = "/";
const args = process.argv.slice(2);
const rootArgumentIndex = args.indexOf("--root");
const portArgumentIndex = args.indexOf("--port");
const root = path.resolve(
  rootArgumentIndex >= 0 ? args[rootArgumentIndex + 1] : "dist",
);
const port = Number(portArgumentIndex >= 0 ? args[portArgumentIndex + 1] : 4174);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".ttf", "font/ttf"],
  [".wasm", "application/wasm"],
]);

const fallbackPath = path.join(root, "404.html");
const rootWithSeparator = root.endsWith(path.sep) ? root : `${root}${path.sep}`;

const safePathForRequest = (pathname) => {
  if (!pathname.startsWith(BASE_PATH)) return null;
  const relative = pathname.slice(BASE_PATH.length) || "index.html";
  const candidate = path.resolve(root, relative.replaceAll("/", path.sep));
  if (candidate !== root && !candidate.startsWith(rootWithSeparator)) return null;
  return candidate;
};

const sendFallback = async (response) => {
  response.statusCode = 404;
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(await readFile(fallbackPath));
};

const server = createServer(async (request, response) => {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.statusCode = 405;
      response.end("Method Not Allowed");
      return;
    }

    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const candidate = safePathForRequest(decodeURIComponent(url.pathname));
    if (!candidate || !(await stat(candidate).then(() => true).catch(() => false))) {
      await sendFallback(response);
      return;
    }

    const body = await readFile(candidate);
    response.statusCode = 200;
    response.setHeader(
      "Content-Type",
      contentTypes.get(path.extname(candidate).toLowerCase()) ?? "application/octet-stream",
    );
    response.setHeader("Cache-Control", "no-store");
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.statusCode = 500;
    response.end("Local artifact server error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`PAGES_FALLBACK_SERVER_READY http://127.0.0.1:${port}${BASE_PATH}`);
});
