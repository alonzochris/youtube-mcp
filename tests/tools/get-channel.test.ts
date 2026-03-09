import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

vi.mock("../../src/config.js", () => ({
  config: { YOUTUBE_API_KEY: "fake-key" },
}));

const mockGetChannelInfo = vi.fn();
vi.mock("../../src/youtube-api.js", () => ({
  getChannelInfo: (...args: unknown[]) => mockGetChannelInfo(...args),
}));

const { registerGetChannel } = await import("../../src/tools/get-channel.js");

beforeEach(() => vi.clearAllMocks());

describe("get_channel tool", () => {
  it("returns formatted channel details", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerGetChannel(server);

    mockGetChannelInfo.mockResolvedValue({ channelId: "UCtest", title: "Test" });

    const handler = (server as any)._registeredTools?.["get_channel"]?.handler;
    const result = await handler({ channelId: "UCtest" });
    expect(JSON.parse(result.content[0].text).title).toBe("Test");
  });

  it("returns isError when channel not found", async () => {
    const server = new McpServer({ name: "test", version: "1.0.0" });
    registerGetChannel(server);

    mockGetChannelInfo.mockRejectedValue(new Error("Channel not found: UCbad"));

    const handler = (server as any)._registeredTools?.["get_channel"]?.handler;
    const result = await handler({ channelId: "UCbad" });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Channel not found");
  });
});
