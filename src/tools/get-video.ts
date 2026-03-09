import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getVideoDetails } from "../youtube-api.js";

export function registerGetVideo(server: McpServer) {
  server.tool(
    "get_video",
    "Get details for a YouTube video by ID",
    {
      videoId: z.string().describe("YouTube video ID"),
    },
    async ({ videoId }) => {
      try {
        const data = await getVideoDetails(videoId);
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
