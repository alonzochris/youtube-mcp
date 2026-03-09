import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

vi.mock("../../src/config.js", () => ({
  config: { YOUTUBE_API_KEY: "fake-key" },
}));

const mockSearchVideos = vi.fn();
vi.mock("../../src/youtube-api.js", () => ({
  searchVideos: (...args: unknown[]) => mockSearchVideos(...args),
}));

const { registerSearchVideos } = await import("../../src/tools/search-videos.js");

beforeEach(() => vi.clearAllMocks());

describe("search_videos tool", () => {
  it("registers and returns formatted results", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerSearchVideos(server);

    mockSearchVideos.mockResolvedValue([{ videoId: "abc", title: "Test" }]);

    // Access the tool handler via the server's internal tool map
    const handler = (server as any)._registeredTools?.["search_videos"]?.handler;
    expect(handler).toBeDefined();

    const result = await handler({ query: "test", maxResults: 5 });
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual([{ videoId: "abc", title: "Test" }]);
    expect(result.isError).toBeUndefined();
  });

  it("returns isError on failure", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerSearchVideos(server);

    mockSearchVideos.mockRejectedValue(new Error("Quota exceeded"));

    const handler = (server as any)._registeredTools?.["search_videos"]?.handler;
    const result = await handler({ query: "test", maxResults: 5 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Quota exceeded");
  });
});
