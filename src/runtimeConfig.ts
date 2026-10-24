// Optional per-deployment RPC defaults, served next to the app as
// runtime-config.json (the Docker server builds it from config.json).
// Browser RPC overrides still take precedence, then the viem default.
let rpcDefaults: Record<number, string> = {};

function rpcUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const url = value.trim();
  return ["http:", "https:"].includes(new URL(url).protocol) ? url : undefined;
}

export function parseRuntimeConfig(value: unknown): Record<number, string> {
  const rpc = (value as { rpc?: unknown } | null)?.rpc;
  if (!rpc || typeof rpc !== "object") return {};
  const result: Record<number, string> = {};
  for (const [id, url] of Object.entries(rpc)) {
    const chainId = Number(id);
    if (!Number.isSafeInteger(chainId) || chainId < 1) continue;
    try {
      const valid = rpcUrl(url);
      if (valid) result[chainId] = valid;
    } catch {
      /* Ignore malformed URLs. */
    }
  }
  return result;
}

export function setRuntimeConfig(value: unknown) {
  rpcDefaults = parseRuntimeConfig(value);
}

export async function loadRuntimeConfig() {
  try {
    const response = await fetch("./runtime-config.json", {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    setRuntimeConfig(response.ok ? await response.json() : {});
  } catch {
    setRuntimeConfig({});
  }
}

export function defaultRpcUrl(chainId: number): string | undefined {
  return rpcDefaults[chainId];
}
