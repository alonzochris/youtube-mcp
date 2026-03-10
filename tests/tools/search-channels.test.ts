import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

vi.mock("../../src/config.js", () => ({
  config: { YOUTUBE_API_KEY: "fake-key" },
}));

const mockSearchChannels = vi.fn();
vi.mock("../../src/youtube-api.js", () => ({
  searchChannels: (...args: unknown[]) => mockSearchChannels(...args),
}));

const { registerSearchChannels } = await import("../../src/tools/search-channels.js");

beforeEach(() => vi.clearAllMocks());

describe("search_channels tool", () => {
  it("registers and returns formatted results", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerSearchChannels(server);

    mockSearchChannels.mockResolvedValue([{ channelId: "UCtest", title: "Test Channel", viewCount: "500000" }]);

    const handler = (server as any)._registeredTools?.["search_channels"]?.handler;
    expect(handler).toBeDefined();

    const result = await handler({ query: "ai podcast", maxResults: 5 });
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual([{ channelId: "UCtest", title: "Test Channel", viewCount: "500000" }]);
    expect(result.isError).toBeUndefined();
  });

  it("returns isError on failure", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerSearchChannels(server);

    mockSearchChannels.mockRejectedValue(new Error("Quota exceeded"));

    const handler = (server as any)._registeredTools?.["search_channels"]?.handler;
    const result = await handler({ query: "ai podcast", maxResults: 5 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Quota exceeded");
  });
});
