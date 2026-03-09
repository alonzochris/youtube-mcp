import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getPlaylistInfo } from "../youtube-api.js";

export function registerGetPlaylist(server: McpServer) {
  server.tool(
    "get_playlist",
    "Get YouTube playlist details by playlist ID",
    {
      playlistId: z.string().describe("YouTube playlist ID"),
    },
    async ({ playlistId }) => {
      try {
        const data = await getPlaylistInfo(playlistId);
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
