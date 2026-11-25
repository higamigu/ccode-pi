import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { RefreshModelsContext } from "@earendil-works/pi-ai";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { FALLBACK_MODELS, type CCodeModel } from "./ccode-models.ts";

const PROVIDER_ID = "ccode";
const PROVIDER_NAME = "CCode";
const BASE_URL = "https://api.ccode.si/v1";

/** Checked in order when `$CCODE_API_KEY` is not exported (desktop launches skip `.zshrc`). */
const KEY_FILES = [
  join(homedir(), ".config/ccode/api-key"),
  join(homedir(), ".config/opencode/ccode-api-key"),
];

type ProviderModelConfig = {
  id: string;
  name: string;
  reasoning: boolean;
  thinkingLevelMap?: Record<string, string | null>;
  input: ("text" | "image")[];
  cost: { input: number; output: number; cacheRead: number; cacheWrite: number };
  contextWindow: number;
  maxTokens: number;
};

function readKeyFile(path: string): string | undefined {
  try {
    const key = readFileSync(path, "utf8").trim();
    return key || undefined;
  } catch {
    return undefined;
  }
}

function resolveApiKey(): string | undefined {
  const fromEnv = process.env.CCODE_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  for (const path of KEY_FILES) {
    const key = readKeyFile(path);
    if (key) return key;
  }
  return undefined;
}

/** pi treats a leading `!` as a command and `$` as an env reference. */
function escapeConfigLiteral(value: string): string {
  return value.replace(/\$/g, "$$").replace(/^!/, "$!");
}

function price(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

/**
 * pi levels pass through unchanged: CCode normalizes intermediate efforts for
 * models whose catalog entry lists only a subset. Models with only budget-style
 * thinking report no efforts and are exposed without reasoning, because sending
 * any `reasoning_effort` for them makes CCode reject the request.
 */
function thinkingLevelMap(model: CCodeModel): Record<string, string | null> | undefined {
  const reasoning = model.capabilities?.reasoning;
  if (!reasoning) return undefined;

  const efforts = (reasoning.efforts ?? []).filter((effort) => effort !== "none");
  if (efforts.length === 0) return undefined;

  return { off: "none", minimal: "minimal", low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: "max" };
}

function toProviderModel(model: CCodeModel): ProviderModelConfig | undefined {
  if (!model.id) return undefined;
  const thinking = thinkingLevelMap(model);

  return {
    id: model.id,
    name: model.display_name?.trim() || model.id,
    reasoning: thinking !== undefined,
    ...(thinking ? { thinkingLevelMap: thinking } : {}),
    input: ["text", "image"],
    cost: {
      input: price(model.pricing?.input),
      output: price(model.pricing?.output),
      cacheRead: price(model.pricing?.cache_read),
      cacheWrite: price(model.pricing?.cache_write),
    },
    contextWindow: model.context_window ?? 128_000,
    maxTokens: model.max_output_tokens ?? 16_384,
  };
}

function buildModels(raw: readonly CCodeModel[]): ProviderModelConfig[] {
  const byId = new Map<string, ProviderModelConfig>();
  for (const item of raw) {
    const model = toProviderModel(item);
    if (model) byId.set(model.id, model);
  }
  return [...byId.values()];
}

async function fetchCatalog(
  context: RefreshModelsContext,
  apiKey: string | undefined,
): Promise<CCodeModel[]> {
  if (!context.allowNetwork) return [];

  const key = context.credential?.type === "api_key" ? context.credential.key : apiKey;
  if (!key) return [];

  const response = await fetch(`${BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${key}` },
    signal: context.signal,
  });
  if (!response.ok) return [];

  const payload = (await response.json()) as { data?: CCodeModel[] };
  return Array.isArray(payload.data) ? payload.data : [];
}

const STARTUP_TIMEOUT_MS = 3_000;

/** One startup fetch so the live catalog is available to `/model` and `--list-models`. */
async function fetchCatalogAtStartup(apiKey: string | undefined): Promise<CCodeModel[]> {
  if (!apiKey || process.env.PI_OFFLINE) return [];
  try {
    const response = await fetch(`${BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(STARTUP_TIMEOUT_MS),
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { data?: CCodeModel[] };
    return Array.isArray(payload.data) ? payload.data : [];
  } catch {
    return [];
  }
}

const FALLBACK = buildModels(FALLBACK_MODELS);

export default async function ccodeProvider(pi: ExtensionAPI) {
  const apiKey = resolveApiKey();
  const live = await fetchCatalogAtStartup(apiKey);
  const models = live.length > 0 ? buildModels(live) : FALLBACK;

  pi.registerProvider(PROVIDER_ID, {
    name: PROVIDER_NAME,
    baseUrl: BASE_URL,
    ...(apiKey ? { apiKey: escapeConfigLiteral(apiKey) } : {}),
    api: "openai-completions",
    models,
    async refreshModels(context) {
      try {
        const catalog = await fetchCatalog(context, apiKey);
        return catalog.length > 0 ? buildModels(catalog) : models;
      } catch {
        return models;
      }
    },
  });
}
