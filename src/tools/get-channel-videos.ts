import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getChannelVideos } from "../youtube-api.js";

export function registerGetChannelVideos(server: McpServer) {
  server.tool(
    "get_channel_videos",
    "Get recent videos from a YouTube channel",
    {
      channelId: z.string().describe("YouTube channel ID"),
      maxResults: z.number().min(1).max(50).default(10).describe("Number of results (1-50, default 10)"),
    },
    async ({ channelId, maxResults }) => {
      try {
        const data = await getChannelVideos(channelId, maxResults);
        return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );
}
