import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

vi.mock("../../src/config.js", () => ({
  config: { YOUTUBE_API_KEY: "fake-key" },
}));

const mockGetPlaylistItems = vi.fn();
vi.mock("../../src/youtube-api.js", () => ({
  getPlaylistItems: (...args: unknown[]) => mockGetPlaylistItems(...args),
}));

const { registerGetPlaylistItems } = await import("../../src/tools/get-playlist-items.js");

beforeEach(() => vi.clearAllMocks());

describe("get_playlist_items tool", () => {
  it("returns formatted playlist items", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerGetPlaylistItems(server);

    mockGetPlaylistItems.mockResolvedValue([
      { videoId: "v1", title: "Item 1", position: 0 },
      { videoId: "v2", title: "Item 2", position: 1 },
    ]);

    const handler = (server as any)._registeredTools?.["get_playlist_items"]?.handler;
    const result = await handler({ playlistId: "PLtest", maxResults: 25 });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].position).toBe(0);
  });

  it("returns isError on failure", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerGetPlaylistItems(server);

    mockGetPlaylistItems.mockRejectedValue(new Error("Not found"));

    const handler = (server as any)._registeredTools?.["get_playlist_items"]?.handler;
    const result = await handler({ playlistId: "PLbad", maxResults: 25 });
    expect(result.isError).toBe(true);
  });
});
