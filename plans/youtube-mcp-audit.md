# Plan Audit: YouTube MCP Server

**Date**: 2026-03-09
**Plan reviewed**: provided inline
**Overall verdict**: FAIL

## Summary

The plan is well-structured, correctly scoped, and demonstrates solid architectural thinking. However, it contains a **critical API error**: the MCP SDK code examples use the v2 API (`server.registerTool()` with config object) while targeting v1.27.1, which uses `server.tool()` with positional arguments. The existing `.env` file also uses a different env var name than what the plan expects. These must be corrected before building.

---

## Findings

### [FAIL] 2.0 Assumption Verification

**Critical: Wrong MCP SDK API method and signature.**

The plan's "Verified SDK API" section shows:

```typescript
server.registerTool("tool-name", {
  description: "What it does",
  inputSchema: { param: z.string().describe("Param description") },
}, async ({ param }) => { ... });
```

This is the **v2 API** (unreleased alpha). SDK v1.27.1 uses the **v1 API**:

```typescript
// Correct v1 API — positional arguments
server.tool(
  "tool-name",
  "What it does",                              // description as 2nd arg
  { param: z.string().describe("Param desc") }, // raw Zod shape as 3rd arg
  async ({ param }) => { ... }                  // handler as 4th arg
);
```

| Aspect | Plan says (v2) | Correct for v1.27.1 |
|--------|---------------|---------------------|
| Method | `server.registerTool()` | `server.tool()` |
| Signature | `(name, { description, inputSchema }, handler)` | `(name, description, schema, handler)` |
| inputSchema | Inside config object | Positional 3rd argument (raw Zod shape) |

The raw Zod shape (not wrapped in `z.object()`) is correct for v1 — but the method name and calling convention are wrong.

**Env var name mismatch.** The plan references `YOUTUBE_API_KEY` throughout, but the existing `.env` file in the project uses `YT_API_KEY`. Pick one and be consistent — recommend using `YOUTUBE_API_KEY` (more explicit) and updating the `.env` file.

**All other assumptions verified:**
- `@googleapis/youtube@31.0.0` — confirmed real, actively maintained, correct API surface
- `youtube-transcript-plus@1.2.0` — confirmed real, API matches plan (`fetchTranscript(videoId, { lang })` returning `[{text, offset, duration, lang}]`)
- Zod v4 + MCP SDK v1.27.1 — confirmed compatible (`peerDependencies: "zod": "^3.25 || ^4.0"`)
- `zod-compat` dual-version support — confirmed real, description bug fixed in v1.25.0

---

### [WARN] 2.1 Dependency Completeness

All packages are identified and version-pinned. Two gaps:

1. **`youtube-transcript-plus` exports typed error classes** that the plan doesn't mention: `YoutubeTranscriptVideoUnavailableError`, `YoutubeTranscriptDisabledError`, `YoutubeTranscriptNotAvailableError`, `YoutubeTranscriptNotAvailableLanguageError`. These could provide much better error messages in `get_transcript` than the generic `error.message` catch-all.

2. **No `dotenv` or env loading mechanism.** The plan defines `.env.example` but never mentions how env vars get loaded at runtime. Options:
   - Rely on the MCP client to set env vars (Claude Code does this via `"env"` in MCP config) — simplest, no extra dependency
   - Add `dotenv` for local development

   Recommend: document in `.env.example` that env vars are set by the MCP client config, and use `dotenv` only in dev/test if needed.

---

### [PASS] 2.2 Scope & Reuse

- Greenfield project (only `.env` exists) — nothing to reuse
- 7 tools is proportional to the goal of a "minimal, read-only YouTube MCP server"
- Flat architecture with no unnecessary abstractions is the right call
- File count (~20 files including tests) is reasonable

---

### [PASS] 2.3 Integration Seams

Clean and well-defined:
- **MCP Client → index.ts**: stdio transport, standard MCP protocol — no custom seam
- **index.ts → tools/*.ts**: Each tool file exports a `register(server)` function — simple, testable
- **tools/*.ts → youtube-api.ts / transcript-api.ts**: Plain function calls returning shaped data
- **youtube-api.ts → @googleapis/youtube**: Standard Google API client
- **transcript-api.ts → youtube-transcript-plus**: Single function wrapper

Data contracts are implicit (TypeScript return types) but sufficient for this scale. No shared state between tools.

---

### [WARN] 2.4 Framework Currency

1. **MCP SDK**: As noted above, the plan cites v2 API patterns. The v1 docs must be used. Specifically:
   - Verify `server.tool()` signature against the [MCP TypeScript SDK README](https://github.com/modelcontextprotocol/typescript-sdk) for the v1.x branch
   - Note: v2.0.0 is in alpha (`2.0.0-alpha.0`) — do not accidentally install it

2. **Zod v4 edge case**: The SDK's `isZ4Schema()` detection checks for a `_zod` internal property. Standard Zod v4 schemas (from `import { z } from "zod"`) may lack this, causing them to be routed through the v3 parsing path. This is usually harmless but could silently drop `additionalProperties: false` from tool schemas. If odd schema behavior occurs during testing, try importing from `zod/v4-mini` instead.

**Docs to verify before building:**
- MCP TypeScript SDK v1.x `server.tool()` API
- `@googleapis/youtube` initialization with API key string

---

### [WARN] 2.5 Failure Modes

The error handling pattern (try/catch returning `isError: true`) is correct. Three gaps:

1. **YouTube API quota exhaustion.** The YouTube Data API v3 has a default quota of 10,000 units/day. `search.list` costs 100 units per call. The plan doesn't mention quota — at minimum, the error handler should recognize HTTP 403 quota errors and return a clear "API quota exceeded" message rather than a generic error.

2. **Transcript unavailability.** Many videos have transcripts disabled or unavailable. `youtube-transcript-plus` throws specific error types for these cases. The `get_transcript` tool should catch these specifically and return helpful messages like "Transcript is disabled for this video" rather than a raw error string.

3. **Invalid API key at startup.** The plan validates that `YOUTUBE_API_KEY` exists, but doesn't validate it's a working key. A bad key silently passes config validation and only fails on the first API call. Consider: making a lightweight API call during startup (e.g., `youtube.channels.list` for a known channel) to fail fast — or accept that the first tool call will surface the error (simpler, probably fine).

---

### [PASS] 2.6 Build Order & Testability

Build phases are well-ordered:
- Phase 1 (scaffold) has no dependencies — correct starting point
- Phase 2 (API + first 2 tools) builds on Phase 1's config — correct
- Phase 3 (transcript) is independent of Phase 2 — could even be parallel
- Phase 4 (remaining tools) extends Phase 2's patterns — correct
- Phase 5 (integration) tests everything together — correct final step

Each phase has clear test criteria and verification steps. No circular dependencies.

---

### [PASS] 2.7 Scope Creep Check

The plan is focused. 7 read-only tools, no write operations, no OAuth flows, no pagination helpers, no caching layer. Each tool maps 1:1 to a YouTube API endpoint. No "nice to haves" are smuggled in.

One note: the `~70 tests` estimate might be aggressive for a first pass. The three-layer testing strategy (Zod schemas + API wrappers + tool handlers) is sound, but start with the API wrapper and tool handler tests — Zod schema validation tests add less value when the schemas are simple (`z.string()`, `z.number().min(1).max(50).default(5)`).

---

## Required Actions (FAIL items)

- [ ] **Fix MCP SDK API**: Replace all `server.registerTool(name, { description, inputSchema }, handler)` with `server.tool(name, description, inputSchema, handler)` throughout the plan
- [ ] **Fix method name**: `registerTool` → `tool` in all code examples and the "Verified SDK API" section
- [ ] **Resolve env var name**: Decide on `YOUTUBE_API_KEY` vs `YT_API_KEY`, update plan's `config.ts` spec and the existing `.env` file to match

## Recommended Actions (WARN items)

- [ ] Add `youtube-transcript-plus` error types to the error handling section for `get_transcript` (return "Transcript disabled" / "Transcript not available" / "Language not available" instead of generic errors)
- [ ] Clarify env var loading strategy — recommend relying on MCP client config `"env"` block, document in `.env.example`
- [ ] Add a note about YouTube API quota (10,000 units/day, `search.list` = 100 units) — consider mentioning this in tool descriptions so the LLM can be quota-aware
- [ ] Note the Zod v4 `_zod` detection edge case — if schema metadata is lost during testing, try `zod/v4-mini` imports

## Docs to Verify Before Building

- [ ] MCP TypeScript SDK v1.x branch — `server.tool()` exact signature and overloads
- [ ] `@googleapis/youtube` — initialization with API key string (`youtube({ version: 'v3', auth: key })`)
- [ ] `youtube-transcript-plus` — `fetchTranscript()` import path and error types
- [ ] YouTube Data API v3 quota costs per endpoint
