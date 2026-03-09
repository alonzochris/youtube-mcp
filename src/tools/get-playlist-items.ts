import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPlaylistItems } from "../youtube-api.js";

export function registerGetPlaylistItems(server: McpServer) {
  server.tool(
    "get_playlist_items",
    "Get items in a YouTube playlist",
    {
      playlistId: z.string().describe("YouTube playlist ID"),
      maxResults: z.number().min(1).max(50).default(25).describe("Number of results (1-50, default 25)"),
    },
    async ({ playlistId, maxResults }) => {
      try {
        const data = await getPlaylistItems(playlistId, maxResults);
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
