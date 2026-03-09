import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

vi.mock("../../src/config.js", () => ({
  config: { YOUTUBE_API_KEY: "fake-key" },
}));

const mockGetVideoDetails = vi.fn();
vi.mock("../../src/youtube-api.js", () => ({
  getVideoDetails: (...args: unknown[]) => mockGetVideoDetails(...args),
}));

const { registerGetVideo } = await import("../../src/tools/get-video.js");

beforeEach(() => vi.clearAllMocks());

describe("get_video tool", () => {
  it("returns formatted video details", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerGetVideo(server);

    mockGetVideoDetails.mockResolvedValue({ videoId: "abc", title: "Test", viewCount: "1000" });

    const handler = (server as any)._registeredTools?.["get_video"]?.handler;
    const result = await handler({ videoId: "abc" });
    expect(JSON.parse(result.content[0].text).viewCount).toBe("1000");
    expect(result.isError).toBeUndefined();
  });

  it("returns isError when video not found", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerGetVideo(server);

    mockGetVideoDetails.mockRejectedValue(new Error("Video not found: xyz"));

    const handler = (server as any)._registeredTools?.["get_video"]?.handler;
    const result = await handler({ videoId: "xyz" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Video not found");
  });
});
