# CCode provider for pi

A [pi](https://pi.dev) extension that registers CCode as a model provider, so
CCode's models appear in `/model` and requests go through
`https://api.ccode.si/v1`.

## Install

```sh
mkdir -p ~/.pi/agent/extensions
ln -sfn "$(pwd)" ~/.pi/agent/extensions/ccode-pi
```

Then restart pi, or run `/reload`. Check with:

```sh
pi --list-models ccode
```

## Credentials

The key is read from the first source that has one:

1. `$CCODE_API_KEY`
2. `~/.config/ccode/api-key`

The file fallbacks matter because processes started outside a login shell do not
read `.zshrc`. If no key is found, the provider is still registered, and you can
supply a key through pi's `/login` flow.

Change the key in `.zshrc` to make it take precedence on the next launch.

## Models

`GET https://api.ccode.si/v1/models` drives the catalog: names, context windows,
output limits, prices, and reasoning support are refreshed from CCode at startup
(3 second timeout) and whenever pi refreshes model catalogs. A snapshot in
`ccode-models.ts` (captured 2026-11-25) is used when the network, the key, or the
endpoint is unavailable, so the models still show up offline. Start with
`PI_OFFLINE=1` to skip the startup fetch entirely.

Models that only support budget-style thinking (`claude-opus-5`,
`claude-haiku-4-5`) are exposed without reasoning levels because CCode rejects
`reasoning_effort` for them.

## Usage

```sh
pi --model ccode/glm-5.3
pi --model ccode/claude-sonnet-5-5
```

Inside pi, use `/model` and pick a CCode model, or reference it as
`ccode/<model-id>`.

## Usage limits in T3 Code (optional)

T3 Code shows plan limits only for drivers that probe a subscription API, and Pi
is not one of them. It does, however, accept custom HTTP usage sources, and CCode
already answers everything needed at `GET /v1/limits`. `t3-usage-source.mjs`
adapts that answer to the shape T3 expects and serves it on loopback:

```sh
systemctl --user enable --now ccode-usage.service   # unit below
curl http://127.0.0.1:8787/limits
```

Then add the source in T3 Code under **Settings → Providers → Usage sources →
Add HTTP source** with URL `http://127.0.0.1:8787/limits`, or write it to
`~/.t3/userdata/settings.json` (T3 reloads that file on change):

```json
{
  "usageLimitSources": {
    "ccode": {
      "kind": "http",
      "label": "CCode",
      "url": "http://127.0.0.1:8787/limits",
      "enabled": true
    }
  }
}
```

`~/.config/systemd/user/ccode-usage.service`:

```ini
[Unit]
Description=CCode usage limits source for T3 Code

[Service]
Type=simple
WorkingDirectory=%h/projects/higa/pi/ccode-pi
Environment=HOME=%h
ExecStart=/usr/bin/env node %h/projects/higa/pi/ccode-pi/t3-usage-source.mjs --port 8787
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

The shim reads the key from the same places as the provider and sends it as a
bearer token; nothing needs to be stored in T3. `--host`/`--port` and
`$CCODE_USAGE_PORT` are the only options, and `/health` reports whether a read
has succeeded. A user unit does not inherit your shell `PATH`, so if `node` is
not in `/usr/bin`, use the absolute path printed by `command -v node` in
`ExecStart`.

What T3 can and cannot show from CCode:

| CCode | In T3 |
| --- | --- |
| 5-hour, weekly, monthly dollar limits | windows in the Usage panel and composer popover |
| Per-model sub-cap (`models["claude-*"]`) | not expressible: HTTP windows have no `modelIds` |
| Usage credits, requests/minute (`GET /key`, `x-ratelimit-*`) | no field in T3's limit model |
| Cost and tokens per model/day | already tracked: T3 reads pi sessions and takes the reported `usage.cost.total` |

Limits are display-only. Waiting for a reset and auto-continuing after a limit
key off run failures and hub matching, which do not apply to an HTTP source.

## Uninstall

```sh
rm ~/.pi/agent/extensions/ccode-pi
rm ~/.config/systemd/user/ccode-usage.service
systemctl --user disable --now ccode-usage.service
```
