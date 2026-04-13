# Project Agent Guide

> This `AGENTS.md` documents the current state of the repository for AI coding agents.

## Project Overview

**Repository Name:** `FAA-poster`  
**Current Branch:** `main`

This is a **PosterStack** project — an evolving AI poster/advertisement generation system built on top of `gstack-kimi-cli`, `evolver`, and `Gemini 3.1 Flash Image Preview` (nano-banana 2) via dmxapi.cn.

**Architecture v2.0 (ImageGen Stack):**  
The system has pivoted from HTML-based pre-layout rendering to a **pure image generation + multi-turn editing** workflow. Posters are created entirely through text-to-image and conversational image editing, then evolved via the GEP protocol.

## Technology Stack

- **gstack-kimi-cli** (`~/.kimi/skills/posterstack-*`): 6 custom skills for design-role collaboration.
- **evolver** (`EvoMap/evolver`): GEP-powered evolution engine running in standalone mode.
- **dmxapi.cn**: Host for `gemini-3.1-flash-image-preview` (Nano Banana 2) supporting 1K/2K/4K image generation and multi-turn image editing.
- **Node.js 18+**: Bridge (`bridge/`) and Applier (`applier/`), including auto-LLM runner.
- **Python 3.9+**: API wrapper layer (`src/faa_poster/`) using `requests` and `pillow`.

## Directory Layout

```
skills/           # Custom gstack SKILL.md definitions
  poster-brief/
  poster-strategy/
  poster-prompt/    # NEW: Prompt engineer
  poster-visualize/ # NEW: Text-to-image generation
  poster-edit/      # NEW: Multi-turn image editing
  poster-check/
bridge/           # Signal collector & formatter for evolver memory/
applier/          # GEP prompt parser, skill updater, and LLM auto-caller
assets/gep/       # genes.json & capsules.json (image-prompt focused)
memory/           # Evolver input logs (gitignored)
src/faa_poster/   # Python CLI and API wrappers
  imagegen.py       # Gemini Image API wrapper
  prompt_builder.py # brief → structured image prompt
  cli.py            # Commands: visualize, edit, check, build-prompt
examples/         # Sample briefs (JSON)
tests/            # Node.js built-in tests + pytest
```

## Build, Test, and Run

### Install
```bash
npm install
pip install -e ".[dev]"
bash bin/setup-skills
```

### Run one design round manually
In Kimi CLI:
```
/poster-brief
/poster-strategy
/poster-prompt
/poster-visualize
/poster-edit
/poster-check
```

### Run fully automated evolution loop
```bash
bash run-poster-evolution.sh 1
```
This script is fully automated: after evolver generates the GEP prompt, `applier/index.js --auto-llm` calls the configured LLM API (defined in `.env`) to obtain the Mutation/Gene/Capsule JSON, then applies it to the skill definitions.

### Run tests
```bash
npm test          # Node bridge/applier tests
pytest            # Python model/prompt tests
```

## Development Conventions

- **Skills**: Do not edit `SKILL.md` if a `.tmpl` exists (not yet used here). For now, edit `.md` directly.
- **Evolver assets**: `genes.json` and `capsules.json` must remain valid JSON. `capsules.json` is auto-updated by `applier/`.
- **Memory logs**: `memory/` is ephemeral. Only `.gitkeep` is tracked.
- **Non-destructive applier**: The applier appends evolved rules to `SKILL.md` instead of rewriting the whole file.
- **API credentials**: Stored in `.env` (ignored by git). Never hardcode keys.
- **Image editing timeout**: Each `edit_image` API call can take 2-4 minutes. The wrapper uses a 180-second HTTP timeout.
