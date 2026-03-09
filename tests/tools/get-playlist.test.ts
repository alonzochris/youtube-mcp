import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

vi.mock("../../src/config.js", () => ({
  config: { YOUTUBE_API_KEY: "fake-key" },
}));

const mockGetPlaylistInfo = vi.fn();
vi.mock("../../src/youtube-api.js", () => ({
  getPlaylistInfo: (...args: unknown[]) => mockGetPlaylistInfo(...args),
}));

const { registerGetPlaylist } = await import("../../src/tools/get-playlist.js");

beforeEach(() => vi.clearAllMocks());

describe("get_playlist tool", () => {
  it("returns formatted playlist details", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerGetPlaylist(server);

    mockGetPlaylistInfo.mockResolvedValue({ playlistId: "PLtest", title: "My Playlist", itemCount: 5 });

    const handler = (server as any)._registeredTools?.["get_playlist"]?.handler;
    const result = await handler({ playlistId: "PLtest" });
    expect(JSON.parse(result.content[0].text).itemCount).toBe(5);
  });

  it("returns isError when playlist not found", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerGetPlaylist(server);

    mockGetPlaylistInfo.mockRejectedValue(new Error("Playlist not found: PLbad"));

    const handler = (server as any)._registeredTools?.["get_playlist"]?.handler;
    const result = await handler({ playlistId: "PLbad" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Playlist not found");
  });
});
