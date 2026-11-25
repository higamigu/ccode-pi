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
3. `~/.config/opencode/ccode-api-key`

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

## Uninstall

```sh
rm ~/.pi/agent/extensions/ccode-pi
```
