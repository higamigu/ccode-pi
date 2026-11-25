#!/usr/bin/env node
/**
 * CCode usage limits for T3 Code.
 *
 * T3 Code's "Add HTTP source" (Settings > Providers > Usage sources) expects
 *
 *   { "version": 1, "accounts": [ { "id", "label", "providerInstanceId",
 *     "windows": [ { "id", "kind", "label", "usedPercent", "resetsAt" } ] } ] }
 *
 * while CCode's `GET /v1/limits` answers `{ plan, windows: { five_hour, weekly,
 * monthly }, models, ... }`. This shim serves T3's shape from CCode's, reading
 * the key the same way the pi provider does.
 *
 *   node t3-usage-source.mjs [--port 8787] [--host 127.0.0.1]
 *
 * Routes: `GET /limits` (T3 quota response), `GET /health`.
 */

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const API = "https://api.ccode.si/v1";

/** Same order as index.ts: env first, then the files desktop launches can see. */
const KEY_FILES = [
  join(homedir(), ".config/ccode/api-key"),
  join(homedir(), ".config/opencode/ccode-api-key"),
];

/** T3 polls every providerHealthRefreshInterval (5 min); this only absorbs manual refreshes. */
const CACHE_MS = 15_000;
const UPSTREAM_TIMEOUT_MS = 9_000;

/** CCode window -> T3 `kind` and the label shown in the limits panel. */
const WINDOW_MAP = {
  five_hour: { kind: "session", label: "5-hour" },
  weekly: { kind: "weekly", label: "Week" },
  monthly: { kind: "monthly", label: "Month" },
};

function log(message, fields) {
  const line = fields === undefined ? message : `${message} ${JSON.stringify(fields)}`;
  process.stderr.write(`${new Date().toISOString()} ${line}\n`);
}

function readKeyFile(path) {
  try {
    const key = readFileSync(path, "utf8").trim();
    return key || undefined;
  } catch {
    return undefined;
  }
}

function resolveApiKey() {
  const fromEnv = process.env.CCODE_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  for (const path of KEY_FILES) {
    const key = readKeyFile(path);
    if (key) return key;
  }
  return undefined;
}

function clampPercent(value) {
  const number = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(100, number));
}

/** `pro-monthly` -> `Pro`; nothing recognizable falls back to the raw plan. */
function planLabel(plan) {
  const first = typeof plan === "string" ? plan.split("-")[0].trim() : "";
  if (first.length === 0) return "CCode";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/** T3 rejects an account without at least `id`, `kind`, `label`, `usedPercent`. */
function toWindows(windows) {
  const result = [];
  for (const [key, window] of Object.entries(windows ?? {})) {
    const mapped = WINDOW_MAP[key];
    const percent = typeof window?.percent === "number" ? window.percent : null;
    // A top-up plan has windows without a cap (`percent: null`); a 0% bar there
    // would claim an allowance that does not exist, so leave it out.
    if (!mapped || percent === null) continue;
    const resetsAt = typeof window.resets_at === "string" ? window.resets_at : undefined;
    result.push({
      id: key,
      kind: mapped.kind,
      label: mapped.label,
      usedPercent: clampPercent(percent),
      ...(resetsAt === undefined ? {} : { resetsAt }),
    });
  }
  return result;
}

function toQuotaResponse(limits) {
  const windows = toWindows(limits?.windows);
  return {
    version: 1,
    accounts: [
      {
        id: "ccode",
        label: planLabel(limits?.plan),
        providerInstanceId: "pi",
        windows,
      },
    ],
  };
}

const state = {
  key: resolveApiKey(),
  cached: null,
  cachedAt: 0,
  inflight: null,
  lastError: null,
  lastSuccessAt: null,
  reads: 0,
};

async function readLimits() {
  if (state.key === undefined) throw new Error("no CCode API key found (env or key file)");

  const response = await fetch(`${API}/limits`, {
    headers: { Authorization: `Bearer ${state.key}`, Accept: "application/json" },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`CCode answered ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }
  return await response.json();
}

async function quota() {
  const now = Date.now();
  if (state.cached !== null && now - state.cachedAt < CACHE_MS) return state.cached;
  if (state.inflight !== null) return await state.inflight;

  state.inflight = (async () => {
    try {
      const body = toQuotaResponse(await readLimits());
      state.cached = body;
      state.cachedAt = Date.now();
      state.lastSuccessAt = new Date(state.cachedAt).toISOString();
      state.lastError = null;
      return body;
    } catch (error) {
      state.lastError = error instanceof Error ? error.message : String(error);
      log("limits read failed", { error: state.lastError });
      throw error;
    } finally {
      state.inflight = null;
    }
  })();

  return await state.inflight;
}

function send(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(payload),
  });
  response.end(payload);
}

function parseArguments(argv) {
  const options = { host: "127.0.0.1", port: Number(process.env.CCODE_USAGE_PORT ?? 8787) };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--port") {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error("--port needs a port number");
      options.port = value;
      index += 1;
    } else if (argument === "--host") {
      const value = argv[index + 1];
      if (value === undefined || value.length === 0) throw new Error("--host needs an interface");
      options.host = value;
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      process.stdout.write("usage: node t3-usage-source.mjs [--host 127.0.0.1] [--port 8787]\n");
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

const options = parseArguments(process.argv.slice(2));

if (state.key === undefined) {
  log("starting without a CCode key: /limits will answer 502 until one exists");
}

const server = createServer(async (request, response) => {
  const path = (request.url ?? "/").split("?")[0]?.replace(/\/+$/, "") || "/";

  if (request.method !== "GET") {
    send(response, 405, { error: "method not allowed" });
    return;
  }

  if (path === "/limits") {
    state.reads += 1;
    try {
      send(response, 200, await quota());
    } catch {
      // T3 keeps its previous reading when a source errors, so a bare failure is fine.
      send(response, 502, { error: "could not read CCode limits" });
    }
    return;
  }

  if (path === "/health") {
    send(response, 200, {
      ok: state.cached !== null,
      key: state.key === undefined ? "missing" : "present",
      lastSuccessAt: state.lastSuccessAt,
      lastError: state.lastError,
      reads: state.reads,
    });
    return;
  }

  send(response, 404, { error: "not found" });
});

server.listen(options.port, options.host, () => {
  log("listening", { host: options.host, port: options.port, key: state.key === undefined ? "missing" : "present" });
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}