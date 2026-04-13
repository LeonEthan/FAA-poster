# Project Agent Guide

> This `AGENTS.md` documents the current state of the repository for AI coding agents.

## Project Overview

**Repository Name:** `FAA-poster`  
**Remote:** `https://github.com/LeonEthan/FAA-poster.git`  
**Current Branch:** `main`

This is a **newly initialized Git repository** (only one commit: "Initial commit"). At present, the project contains **no source code, no configuration files, and no defined build system**.

## Current Repository Contents

The only tracked file is:

- `.gitignore` — A comprehensive Python-oriented `.gitignore` template. It ignores common Python artifacts (`__pycache__`, `*.pyc`, build directories), virtual environments (`.venv`, `env/`), package-manager lock files (UV, Poetry, PDM, Pixi), IDE settings (PyCharm, VS Code, Cursor), and testing/coverage artifacts (`.pytest_cache/`, `.coverage`, `htmlcov/`).

There are **no** `pyproject.toml`, `package.json`, `Cargo.toml`, `requirements.txt`, `Makefile`, or other technology-specific configuration files present.

## Technology Stack

**Unknown / Not yet established.**

The `.gitignore` suggests the project is *likely* intended to be Python-based, but this cannot be confirmed until source files and dependency manifests are added.

## Code Organization

**Not applicable.** No source directories or modules exist yet.

## Build, Test, and Deployment

**Not applicable.** No build scripts, test suites, CI/CD configurations, or deployment manifests exist yet.

## Development Conventions

**Not yet defined.** Since there is no existing code, there are no established style guidelines, linting rules, or testing strategies to follow. When code is added, it will be up to the first commits to establish these conventions.

## Recommendations for Future Agents

1. **Verify the actual stack** before making assumptions. Look for `pyproject.toml`, `requirements.txt`, `package.json`, etc., to confirm the language and framework.
2. **Check for new commits** if returning to this repo later; the current empty state may have changed.
3. **Start simple** if bootstrapping the project: add a dependency file and a minimal entry point, then expand.
