import { createServer, type IncomingMessage } from "node:http";
import { readdir, readFile, lstat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { parseArgs } from "node:util";

// Container counterpart of cli/server.ts: same static files and headers, but
// the listen address, accepted hosts and RPC defaults come from config.json.
export type ServerConfig = {
  host: string;
  port: number;
  allowedHosts: string[];
  distDir: string;
  rpc: Record<string, string>;
};
type ConfigFile = {
  server?: Partial<Omit<ServerConfig, "rpc">>;
  rpc?: Record<string, unknown>;
};
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};
const HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src http: https:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
};
const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]"]);

function validatePort(value: unknown) {
  const port = Number(value ?? 4173);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error("server.port must be an integer from 1024 to 65535.");
  return port;
}

function validateHosts(value: unknown) {
  const hosts = value ?? [];
  if (!Array.isArray(hosts) || hosts.some((h) => typeof h !== "string"))
    throw new Error("server.allowedHosts must be an array of host names.");
  return hosts.map((h: string) => h.toLowerCase());
}

function validateRpc(value: unknown) {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error('rpc must map chain IDs to URLs, e.g. {"1": "https://…"}.');
  const rpc: Record<string, string> = {};
  for (const [id, url] of Object.entries(value)) {
    if (!/^[1-9]\d*$/.test(id)) throw new Error(`rpc: invalid chain ID ${id}.`);
    if (typeof url !== "string" || !/^https?:$/.test(new URL(url).protocol))
      throw new Error(`rpc.${id} must be an HTTP or HTTPS URL.`);
    rpc[id] = url;
  }
  return rpc;
}

export function validateConfig(value: ConfigFile): ServerConfig {
  const server = value.server ?? {};
  return {
    host: server.host || "0.0.0.0",
    port: validatePort(server.port),
    allowedHosts: validateHosts(server.allowedHosts),
    distDir: server.distDir || "dist",
    rpc: validateRpc(value.rpc),
  };
}

async function collect(directory: string, prefix = "") {
  const files = new Map<string, Uint8Array>();
  for (const name of await readdir(directory)) {
    const path = join(directory, name),
      key = prefix + name;
    const stat = await lstat(path);
    if (stat.isSymbolicLink())
      throw new Error("Application assets must not contain symlinks.");
    if (stat.isDirectory()) {
      for (const [file, bytes] of await collect(path, key + "/"))
        files.set(file, bytes);
    } else if (stat.isFile()) files.set(key, await readFile(path));
  }
  return files;
}

// Loopback names are always accepted (DNS rebinding needs a foreign name);
// public names must be listed, or "*" accepts any Host header.
export function hostAllowed(request: IncomingMessage, allowedHosts: string[]) {
  if (allowedHosts.includes("*")) return true;
  const host = (request.headers.host ?? "").toLowerCase();
  const name = host.replace(/:\d+$/, "");
  return LOOPBACK.has(name) || allowedHosts.includes(name);
}

export function createAppServer(
  files: Map<string, Uint8Array>,
  config: ServerConfig,
) {
  return createServer((request, response) => {
    if (!hostAllowed(request, config.allowedHosts)) {
      response.writeHead(403).end();
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405).end();
      return;
    }
    const path = (request.url ?? "/").split("?")[0];
    const key = path === "/" ? "index.html" : path.slice(1);
    const bytes = files.get(key);
    if (!bytes) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      ...HEADERS,
      "Content-Type": TYPES[extname(key)] ?? "application/octet-stream",
      "Content-Length": bytes.length,
    });
    response.end(request.method === "HEAD" ? undefined : bytes);
  });
}

async function main() {
  const { values } = parseArgs({
    options: { config: { type: "string", default: "config.json" } },
    strict: true,
  });
  const configPath = resolve(values.config);
  const config = validateConfig(JSON.parse(await readFile(configPath, "utf8")));
  const files = await collect(resolve(config.distDir));
  if (!files.has("index.html"))
    throw new Error(`${config.distDir} has no index.html.`);
  // The app reads its RPC defaults from this file before rendering.
  files.set(
    "runtime-config.json",
    new TextEncoder().encode(JSON.stringify({ rpc: config.rpc })),
  );
  const server = createAppServer(files, config);
  server.listen(config.port, config.host, () =>
    console.log(
      `FreeLP: listening on ${config.host}:${config.port} (config ${configPath}, RPC defaults for chains: ${Object.keys(config.rpc).join(", ") || "none"})`,
    ),
  );
  process.on("SIGINT", () => server.close(() => process.exit(0)));
  process.on("SIGTERM", () => server.close(() => process.exit(0)));
}

if (import.meta.main)
  void main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
