// Snapshot of `GET https://api.ccode.si/v1/models` captured 2026-11-25.
// Used only when the live catalog cannot be fetched (offline, bad key, outage).

export type CCodeReasoningCapability = {
  modes?: string[] | null;
  efforts?: string[] | null;
};

export type CCodeModel = {
  id: string;
  display_name?: string | null;
  context_window?: number | null;
  max_output_tokens?: number | null;
  pricing?: {
    input?: number | null;
    output?: number | null;
    cache_read?: number | null;
    cache_write?: number | null;
  } | null;
  capabilities?: {
    reasoning?: CCodeReasoningCapability | null;
  } | null;
};

export const FALLBACK_MODELS: CCodeModel[] = [
  {"id": "claude-opus-5-5", "display_name": "Claude Opus 5.5", "context_window": 1000000, "max_output_tokens": 128000, "pricing": {"input": 4, "output": 20, "cache_read": 0.2, "cache_write": 5}, "capabilities": {"reasoning": {"modes": ["adaptive", "effort"], "efforts": ["low", "medium", "high", "xhigh", "max"]}}},
  {"id": "claude-sonnet-5-5", "display_name": "Claude Sonnet 5.5", "context_window": 1000000, "max_output_tokens": 128000, "pricing": {"input": 2, "output": 10, "cache_read": 0.2, "cache_write": 2.5}, "capabilities": {"reasoning": {"modes": ["adaptive", "effort"], "efforts": ["low", "medium", "high", "xhigh", "max"]}}},
  {"id": "claude-fable-5-1", "display_name": "Claude Fable 5.1", "context_window": 1000000, "max_output_tokens": 128000, "pricing": {"input": 10, "output": 50, "cache_read": 0.25, "cache_write": 12.5}, "capabilities": {"reasoning": {"modes": ["adaptive", "effort"], "efforts": ["low", "medium", "high", "xhigh", "max"]}}},
  {"id": "claude-fable-5-2", "display_name": "Claude Fable 5.2", "context_window": 1000000, "max_output_tokens": 128000, "pricing": {"input": 10, "output": 50, "cache_read": 0.25, "cache_write": 12.5}, "capabilities": {"reasoning": {"modes": ["adaptive", "effort"], "efforts": ["low", "medium", "high", "xhigh", "max"]}}},
  {"id": "claude-opus-5", "display_name": "Claude Opus 5", "context_window": 1000000, "max_output_tokens": 128000, "pricing": {"input": 5, "output": 25, "cache_read": 0.5, "cache_write": 6.25}, "capabilities": {"reasoning": {"modes": ["none", "adaptive", "budget"], "efforts": []}}},
  {"id": "claude-sonnet-5", "display_name": "Claude Sonnet 5", "context_window": 1000000, "max_output_tokens": 128000, "pricing": {"input": 2, "output": 10, "cache_read": 0.2, "cache_write": 2.5}, "capabilities": {"reasoning": {"modes": ["none", "adaptive", "effort"], "efforts": ["low", "medium", "high", "xhigh", "max"]}}},
  {"id": "claude-haiku-4-5", "display_name": "Claude Haiku 4.5", "context_window": 200000, "max_output_tokens": 64000, "pricing": {"input": 1, "output": 5, "cache_read": 0.1, "cache_write": 1.25}, "capabilities": {"reasoning": {"modes": ["none", "budget"], "efforts": []}}},
  {"id": "gpt-6.2-astra", "display_name": "GPT-6.2 Astra", "context_window": 1050000, "max_output_tokens": 128000, "pricing": {"input": 8, "output": 40, "cache_read": 0.4, "cache_write": 10}, "capabilities": {"reasoning": {"modes": ["effort"], "efforts": ["low", "medium", "high", "xhigh"]}}},
  {"id": "gpt-6.2-sol", "display_name": "GPT-6.2 Sol", "context_window": 1050000, "max_output_tokens": 128000, "pricing": {"input": 2, "output": 10, "cache_read": 0.1, "cache_write": 2.5}, "capabilities": {"reasoning": {"modes": ["effort"], "efforts": ["low", "medium", "high", "xhigh"]}}},
  {"id": "gpt-6.1-sol", "display_name": "GPT-6.1 Sol", "context_window": 1050000, "max_output_tokens": 128000, "pricing": {"input": 2, "output": 10, "cache_read": 0.1, "cache_write": 2.5}, "capabilities": {"reasoning": {"modes": ["effort"], "efforts": ["low", "medium", "high", "xhigh"]}}},
  {"id": "gpt-6-sol", "display_name": "GPT-6 Sol", "context_window": 1050000, "max_output_tokens": 128000, "pricing": {"input": 2, "output": 10, "cache_read": 0.2, "cache_write": 2.5}, "capabilities": {"reasoning": {"modes": ["none", "effort"], "efforts": ["none", "low", "medium", "high", "xhigh"]}}},
  {"id": "gpt-6-luna", "display_name": "GPT-6 Luna", "context_window": 1050000, "max_output_tokens": 128000, "pricing": {"input": 0.1, "output": 0.5, "cache_read": 0.01, "cache_write": 0.125}, "capabilities": {"reasoning": {"modes": ["none", "effort"], "efforts": ["none", "low", "medium", "high", "xhigh"]}}},
  {"id": "gpt-6-astra", "display_name": "GPT-6 Astra", "context_window": 1050000, "max_output_tokens": 128000, "pricing": {"input": 10, "output": 50, "cache_read": 1, "cache_write": 12.5}, "capabilities": {"reasoning": {"modes": ["effort"], "efforts": ["low", "medium", "high", "xhigh"]}}},
  {"id": "gpt-5.6-sol", "display_name": "GPT-5.6 Sol", "context_window": 1050000, "max_output_tokens": 128000, "pricing": {"input": 4, "output": 20, "cache_read": 0.4, "cache_write": 5}, "capabilities": {"reasoning": {"modes": ["none", "effort"], "efforts": ["none", "low", "medium", "high", "xhigh"]}}},
  {"id": "gpt-5.6-luna", "display_name": "GPT-5.6 Luna", "context_window": 1050000, "max_output_tokens": 128000, "pricing": {"input": 0.2, "output": 1.2, "cache_read": 0.02, "cache_write": 0.25}, "capabilities": {"reasoning": {"modes": ["none", "effort"], "efforts": ["none", "low", "medium", "high", "xhigh"]}}},
  {"id": "gpt-5.6-terra", "display_name": "GPT-5.6 Terra", "context_window": 1050000, "max_output_tokens": 128000, "pricing": {"input": 2, "output": 12, "cache_read": 0.2, "cache_write": 2.5}, "capabilities": {"reasoning": {"modes": ["none", "effort"], "efforts": ["none", "low", "medium", "high", "xhigh"]}}},
  {"id": "gpt-5.5", "display_name": "GPT-5.5", "context_window": 1050000, "max_output_tokens": 128000, "pricing": {"input": 5, "output": 30, "cache_read": 0.5, "cache_write": null}, "capabilities": {"reasoning": {"modes": ["none", "effort"], "efforts": ["none", "low", "medium", "high", "xhigh"]}}},
  {"id": "gpt-5.4", "display_name": "GPT-5.4", "context_window": 1050000, "max_output_tokens": 128000, "pricing": {"input": 2.5, "output": 15, "cache_read": 0.25, "cache_write": null}, "capabilities": {"reasoning": {"modes": ["none", "effort"], "efforts": ["none", "low", "medium", "high", "xhigh"]}}},
  {"id": "gpt-5.4-mini", "display_name": "GPT-5.4 mini", "context_window": 400000, "max_output_tokens": 128000, "pricing": {"input": 0.75, "output": 4.5, "cache_read": 0.075, "cache_write": null}, "capabilities": {"reasoning": {"modes": ["none", "effort"], "efforts": ["none", "low", "medium", "high", "xhigh"]}}},
  {"id": "gpt-5.4-nano", "display_name": "GPT-5.4 nano", "context_window": 400000, "max_output_tokens": 128000, "pricing": {"input": 0.2, "output": 1.25, "cache_read": 0.02, "cache_write": null}, "capabilities": {"reasoning": {"modes": ["none", "effort"], "efforts": ["none", "low", "medium", "high", "xhigh"]}}},
  {"id": "glm-5.3", "display_name": "GLM 5.3", "context_window": 1048576, "max_output_tokens": 943718, "pricing": {"input": 1.4, "output": 4.4, "cache_read": 0.26, "cache_write": null}, "capabilities": {"reasoning": {"modes": ["none", "effort"], "efforts": ["low", "max"]}}},
  {"id": "glm-5.3-flash", "display_name": "GLM 5.3 Flash", "context_window": 1048576, "max_output_tokens": 943718, "pricing": {"input": 0.15, "output": 0.5, "cache_read": 0.03, "cache_write": null}, "capabilities": {"reasoning": null}},
  {"id": "kimi-k3.1-pro", "display_name": "Kimi K3.1 Pro", "context_window": 1048576, "max_output_tokens": 943718, "pricing": {"input": 2, "output": 10, "cache_read": 0.2, "cache_write": null}, "capabilities": {"reasoning": {"modes": ["none", "effort"], "efforts": ["low", "medium", "high", "max"]}}},
  {"id": "deepseek-v4.1-flash", "display_name": "DeepSeek V4.1 Flash", "context_window": 1048576, "max_output_tokens": 393216, "pricing": {"input": 0.15, "output": 0.6, "cache_read": 0.003, "cache_write": null}, "capabilities": {"reasoning": {"modes": ["none", "effort"], "efforts": ["low", "high", "xhigh", "max"]}}},
  {"id": "qwen-4-max", "display_name": "Qwen 4 Max", "context_window": 1000000, "max_output_tokens": 131072, "pricing": {"input": 1.5, "output": 4.5, "cache_read": 0.075, "cache_write": 1.875}, "capabilities": {"reasoning": {"modes": ["none", "effort"], "efforts": ["low", "medium", "high", "max"]}}},
  {"id": "qwen-3.8-max", "display_name": "Qwen 3.8 Max", "context_window": 1000000, "max_output_tokens": 131072, "pricing": {"input": 2, "output": 6, "cache_read": 0.2, "cache_write": 2.5}, "capabilities": {"reasoning": {"modes": ["none", "effort"], "efforts": ["low", "medium", "high", "max"]}}},
];
