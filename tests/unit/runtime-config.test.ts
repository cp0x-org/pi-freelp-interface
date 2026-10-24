import { afterEach, expect, test } from "bun:test";
import type { IncomingMessage } from "node:http";
import { chainSettings, rpcEndpoint } from "../../src/chains";
import { parseRuntimeConfig, setRuntimeConfig } from "../../src/runtimeConfig";
import { hostAllowed, validateConfig } from "../../docker/server";

afterEach(() => setRuntimeConfig({}));

test("runtime config keeps only HTTP(S) RPC URLs for valid chain IDs", () => {
  expect(
    parseRuntimeConfig({
      rpc: {
        "1": " https://eth.example/rpc ",
        "8453": "ws://base.example",
        "0": "https://zero.example",
        x: "https://x.example",
        "42161": "not a url",
        "4663": 5,
      },
    }),
  ).toEqual({ 1: "https://eth.example/rpc" });
  expect(parseRuntimeConfig(null)).toEqual({});
  expect(parseRuntimeConfig({ rpc: "https://eth.example" })).toEqual({});
});

test("browser overrides win over runtime defaults, which win over viem", () => {
  const viemDefault = rpcEndpoint(chainSettings(8453));
  setRuntimeConfig({ rpc: { "8453": "https://base.example" } });
  expect(rpcEndpoint(chainSettings(8453))).toBe("https://base.example");
  expect(rpcEndpoint(chainSettings(8453, "https://mine.example"))).toBe(
    "https://mine.example",
  );
  setRuntimeConfig({});
  expect(rpcEndpoint(chainSettings(8453))).toBe(viemDefault);
});

test("docker config applies defaults and rejects invalid values", () => {
  expect(validateConfig({})).toEqual({
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: [],
    distDir: "dist",
    rpc: {},
  });
  expect(() => validateConfig({ server: { port: 80 } })).toThrow("server.port");
  expect(() => validateConfig({ rpc: { "1": "ftp://x.example" } })).toThrow(
    "rpc.1",
  );
  expect(() => validateConfig({ rpc: { eth: "https://x.example" } })).toThrow(
    "invalid chain ID",
  );
});

test("docker server accepts loopback and listed host names only", () => {
  const request = (host: string) => ({ headers: { host } }) as IncomingMessage;
  expect(hostAllowed(request("127.0.0.1:8080"), [])).toBe(true);
  expect(hostAllowed(request("localhost:4173"), [])).toBe(true);
  expect(hostAllowed(request("evil.example"), [])).toBe(false);
  expect(hostAllowed(request("FreeLP.cp0x.com"), ["freelp.cp0x.com"])).toBe(
    true,
  );
  expect(hostAllowed(request("evil.example"), ["*"])).toBe(true);
});
