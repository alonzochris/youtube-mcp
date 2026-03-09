import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

vi.mock("../../src/config.js", () => ({
  config: { YOUTUBE_API_KEY: "fake-key" },
}));

// Create mock error classes that match the ones in the module
class MockDisabledError extends Error { constructor(m = "") { super(m); } }
class MockNotAvailableError extends Error { constructor(m = "") { super(m); } }
class MockNotAvailableLangError extends Error { constructor(m = "") { super(m); } }
class MockVideoUnavailableError extends Error { constructor(m = "") { super(m); } }
class MockInvalidVideoIdError extends Error { constructor(m = "") { super(m); } }

const mockGetTranscript = vi.fn();

vi.mock("../../src/transcript-api.js", () => ({
  getTranscript: (...args: unknown[]) => mockGetTranscript(...args),
  YoutubeTranscriptDisabledError: MockDisabledError,
  YoutubeTranscriptNotAvailableError: MockNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError: MockNotAvailableLangError,
  YoutubeTranscriptVideoUnavailableError: MockVideoUnavailableError,
  YoutubeTranscriptInvalidVideoIdError: MockInvalidVideoIdError,
}));

const { registerGetTranscript } = await import("../../src/tools/get-transcript.js");

beforeEach(() => vi.clearAllMocks());

describe("get_transcript tool", () => {
  it("returns formatted transcript", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerGetTranscript(server);

    mockGetTranscript.mockResolvedValue([{ text: "Hello", offset: 0, duration: 1 }]);

    const handler = (server as any)._registeredTools?.["get_transcript"]?.handler;
    const result = await handler({ videoId: "abc", lang: "en" });
    expect(JSON.parse(result.content[0].text)).toEqual([{ text: "Hello", offset: 0, duration: 1 }]);
  });

  it("returns specific message when transcript disabled", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerGetTranscript(server);

    mockGetTranscript.mockRejectedValue(new MockDisabledError());

    const handler = (server as any)._registeredTools?.["get_transcript"]?.handler;
    const result = await handler({ videoId: "abc", lang: "en" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Transcript is disabled for this video");
  });

  it("returns specific message when language not available", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerGetTranscript(server);

    mockGetTranscript.mockRejectedValue(new MockNotAvailableLangError());

    const handler = (server as any)._registeredTools?.["get_transcript"]?.handler;
    const result = await handler({ videoId: "abc", lang: "fr" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("fr");
  });

  it("returns specific message when video unavailable", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerGetTranscript(server);

    mockGetTranscript.mockRejectedValue(new MockVideoUnavailableError());

    const handler = (server as any)._registeredTools?.["get_transcript"]?.handler;
    const result = await handler({ videoId: "abc", lang: "en" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe("Video is unavailable");
  });

  it("returns generic error for unknown errors", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerGetTranscript(server);

    mockGetTranscript.mockRejectedValue(new Error("Network fail"));

    const handler = (server as any)._registeredTools?.["get_transcript"]?.handler;
    const result = await handler({ videoId: "abc", lang: "en" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Network fail");
  });
});
