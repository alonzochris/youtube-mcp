import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getChannelInfo } from "../youtube-api.js";

export function registerGetChannel(server: McpServer) {
  server.tool(
    "get_channel",
    "Get YouTube channel details by channel ID",
    {
      channelId: z.string().describe("YouTube channel ID"),
    },
    async ({ channelId }) => {
      try {
        const data = await getChannelInfo(channelId);
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
