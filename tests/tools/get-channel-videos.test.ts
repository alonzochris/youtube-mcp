import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

vi.mock("../../src/config.js", () => ({
  config: { YOUTUBE_API_KEY: "fake-key" },
}));

const mockGetChannelVideos = vi.fn();
vi.mock("../../src/youtube-api.js", () => ({
  getChannelVideos: (...args: unknown[]) => mockGetChannelVideos(...args),
}));

const { registerGetChannelVideos } = await import("../../src/tools/get-channel-videos.js");

beforeEach(() => vi.clearAllMocks());

describe("get_channel_videos tool", () => {
  it("returns formatted channel videos", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerGetChannelVideos(server);

    mockGetChannelVideos.mockResolvedValue([{ videoId: "v1", title: "Recent" }]);

    const handler = (server as any)._registeredTools?.["get_channel_videos"]?.handler;
    const result = await handler({ channelId: "UCtest", maxResults: 10 });
    expect(JSON.parse(result.content[0].text)).toEqual([{ videoId: "v1", title: "Recent" }]);
  });

  it("returns isError on failure", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerGetChannelVideos(server);

    mockGetChannelVideos.mockRejectedValue(new Error("API error"));

    const handler = (server as any)._registeredTools?.["get_channel_videos"]?.handler;
    const result = await handler({ channelId: "UCtest", maxResults: 10 });
    expect(result.isError).toBe(true);
  });
});
